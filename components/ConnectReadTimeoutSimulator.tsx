'use client';

import React, { useEffect, useRef, useState } from 'react';

// 요청 하나가 "TCP 연결" -> "응답 대기" 두 구간을 지나는 걸 보여준다.
// 어느 구간에서 막히느냐에 따라 connect timeout / read timeout 이 갈린다.

// 실시간(1ms = 1ms)으로 돌리면 눈으로 따라가기엔 너무 빠르다.
// 화면은 100ms 마다 갱신하되, 시뮬레이션 시계는 그 절반씩만 흘려서 느리게 보여준다.
const FRAME_MS = 100;
const TICK_MS = 40;

type Phase = 'connecting' | 'waiting' | 'done' | 'connectTimeout' | 'readTimeout';

const SCENARIOS = [
  { key: 'ok', label: '정상 응답', connectMs: 400, responseMs: 700 },
  { key: 'noConnect', label: '연결 실패', connectMs: 99999, responseMs: 0 },
  { key: 'noResponse', label: '응답 없음', connectMs: 400, responseMs: 99999 },
] as const;

type ScenarioKey = (typeof SCENARIOS)[number]['key'];

export default function ConnectReadTimeoutSimulator() {
  const [connectTimeout, setConnectTimeout] = useState(1000);
  const [readTimeout, setReadTimeout] = useState(1500);
  const [scenario, setScenario] = useState<ScenarioKey>('ok');
  const [phase, setPhase] = useState<Phase>('connecting');
  const [elapsed, setElapsed] = useState(0);
  const [connectElapsed, setConnectElapsed] = useState(0);
  const [logMessage, setLogMessage] = useState('요청 시작: TCP 연결을 맺는 중 (자동 시뮬레이션 실행 중)');

  const ref = useRef({ phase, elapsed, connectTimeout, readTimeout, scenario });
  useEffect(() => {
    ref.current = { phase, elapsed, connectTimeout, readTimeout, scenario };
  }, [phase, elapsed, connectTimeout, readTimeout, scenario]);

  const restart = (key: ScenarioKey = scenario) => {
    setPhase('connecting');
    setElapsed(0);
    setConnectElapsed(0);
    setLogMessage(`[Connect] ${SCENARIOS.find((s) => s.key === key)!.label} 시나리오로 TCP 연결 시도`);
  };

  // 진행 타이머
  useEffect(() => {
    if (phase !== 'connecting' && phase !== 'waiting') return undefined;

    const interval = setInterval(() => {
      const cur = ref.current;
      const conf = SCENARIOS.find((s) => s.key === cur.scenario)!;
      const next = cur.elapsed + TICK_MS;

      if (cur.phase === 'connecting') {
        if (next >= conf.connectMs) {
          setConnectElapsed(conf.connectMs);
          setElapsed(0);
          setPhase('waiting');
          setLogMessage(`[Connected] TCP 연결 성공 (${conf.connectMs}ms) ➔ 응답 대기 시작`);
          return;
        }
        if (next >= cur.connectTimeout) {
          setConnectElapsed(cur.connectTimeout);
          setElapsed(cur.connectTimeout);
          setPhase('connectTimeout');
          setLogMessage(`[Timeout] connect timeout ${cur.connectTimeout}ms 초과 ➔ ConnectTimeoutException`);
          return;
        }
        setElapsed(next);
        setConnectElapsed(next);
        return;
      }

      if (next >= conf.responseMs) {
        setElapsed(conf.responseMs);
        setPhase('done');
        setLogMessage(`[Response] 응답 수신 완료 (${conf.responseMs}ms) ➔ 정상 처리`);
        return;
      }
      if (next >= cur.readTimeout) {
        setElapsed(cur.readTimeout);
        setPhase('readTimeout');
        setLogMessage(`[Timeout] read timeout ${cur.readTimeout}ms 초과 ➔ SocketTimeoutException: Read timed out`);
        return;
      }
      setElapsed(next);
    }, FRAME_MS);

    return () => clearInterval(interval);
  }, [phase]);

  // 결과가 나오면 잠깐 보여준 뒤 다음 시나리오로 알아서 넘어간다.
  useEffect(() => {
    if (phase !== 'done' && phase !== 'connectTimeout' && phase !== 'readTimeout') return undefined;
    const timer = setTimeout(() => {
      const idx = SCENARIOS.findIndex((s) => s.key === ref.current.scenario);
      const next = SCENARIOS[(idx + 1) % SCENARIOS.length].key;
      setScenario(next);
      restart(next);
    }, 1800);
    return () => clearTimeout(timer);
  }, [phase]);

  const connectPct = Math.min(100, (connectElapsed / connectTimeout) * 100);
  const readPct = phase === 'connecting' ? 0 : Math.min(100, (elapsed / readTimeout) * 100);

  const segment = (
    label: string,
    pct: number,
    limit: number,
    active: boolean,
    failed: boolean,
    passed: boolean,
  ) => {
    let border = 'border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-800/40';
    let badgeBg = 'bg-slate-400 text-white';
    let badgeText = 'WAITING';
    let barColor = 'bg-slate-400';

    if (failed) {
      border = 'border-rose-500 bg-rose-50/80 dark:border-rose-500/80 dark:bg-rose-950/40 animate-pulse';
      badgeBg = 'bg-rose-600 text-white';
      badgeText = 'TIMEOUT';
      barColor = 'bg-rose-500';
    } else if (active) {
      border = 'border-blue-500 bg-blue-50/60 dark:border-blue-500/80 dark:bg-blue-950/30';
      badgeBg = 'bg-blue-600 text-white';
      badgeText = 'IN PROGRESS';
      barColor = 'bg-blue-500';
    } else if (passed) {
      border = 'border-emerald-500 bg-emerald-50/60 dark:border-emerald-500/80 dark:bg-emerald-950/30';
      badgeBg = 'bg-emerald-600 text-white';
      badgeText = 'PASSED';
      barColor = 'bg-emerald-500';
    }

    return (
      <div className={`relative flex flex-col justify-between rounded-lg border p-3.5 transition-all duration-300 ${border}`}>
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">{label}</span>
          <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${badgeBg}`}>{badgeText}</span>
        </div>

        <div className="my-3 font-mono text-xs">
          <div className="text-slate-500 dark:text-slate-400 text-[11px]">Limit: {limit}ms</div>
          <div className="text-slate-600 dark:text-slate-300 text-[11px]">
            Elapsed: {Math.round((pct / 100) * limit)}ms
          </div>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div className={`h-full transition-all duration-100 ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  };

  return (
    <div className="my-8 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/50 sm:px-6">
        <div className="flex rounded-lg bg-slate-200/80 p-0.5 text-xs font-semibold dark:bg-slate-800">
          {SCENARIOS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => { setScenario(s.key); restart(s.key); }}
              className={`rounded-md px-2.5 py-1 transition ${
                scenario === s.key
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px]">
          <label className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-300">connect</span>
            <input
              type="range" min="500" max="5000" step="250"
              value={connectTimeout}
              onChange={(e) => { setConnectTimeout(parseInt(e.target.value, 10)); restart(); }}
              className="h-1 w-20 accent-blue-600"
            />
            <span className="w-[46px] text-slate-500 dark:text-slate-400">{connectTimeout}ms</span>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-300">read</span>
            <input
              type="range" min="500" max="5000" step="250"
              value={readTimeout}
              onChange={(e) => { setReadTimeout(parseInt(e.target.value, 10)); restart(); }}
              className="h-1 w-20 accent-emerald-600"
            />
            <span className="w-[46px] text-slate-500 dark:text-slate-400">{readTimeout}ms</span>
          </label>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="mb-3 font-mono text-xs text-slate-500 dark:text-slate-400">Request Timeline</div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {segment(
            'TCP 연결',
            connectPct,
            connectTimeout,
            phase === 'connecting',
            phase === 'connectTimeout',
            phase === 'waiting' || phase === 'done' || phase === 'readTimeout',
          )}
          {segment(
            '응답 대기',
            readPct,
            readTimeout,
            phase === 'waiting',
            phase === 'readTimeout',
            phase === 'done',
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 font-mono text-xs text-slate-200 dark:bg-black">
          <span className="text-emerald-400 font-bold">❯</span>
          <span className="truncate">{logMessage}</span>
        </div>
      </div>

      <div className="border-t border-slate-200 p-4 dark:border-slate-800 sm:p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <div className="mb-1 text-sm font-bold text-blue-600 dark:text-blue-400">1) connect timeout</div>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              TCP 연결 자체를 못 맺을 때. 방화벽에 막혔거나 상대가 SYN 에 응답하지 않는 경우다.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <div className="mb-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">2) read timeout</div>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              연결은 됐는데 응답 데이터가 안 올 때. DB 락, GC pause 처럼 상대가 응답을 못 만드는 경우다.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <div className="mb-1 text-sm font-bold text-rose-600 dark:text-rose-400">3) 기본적인 구분</div>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              연결 수립 중이면 connect, 연결 후 응답을 읽다 정체되면 read 다. DNS, TLS handshake, 풀 대기처럼 별도 구간도 있다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
