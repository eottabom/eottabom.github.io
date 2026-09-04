'use client';

import React, { useEffect, useRef, useState } from 'react';

// Tomcat 과 로드밸런서 중 누가 먼저 커넥션을 닫느냐에 따라 증상이 갈리는 걸 보여준다.
// 두 타이머는 서로 다른 프로세스에서 각자 흐르기 때문에, 값을 어떻게 정렬하느냐가 곧 장애 모양이 된다.

const TICK_MS = 120;

type Mode = 'idle' | 'inflight';
type Outcome = null | { badge: string; tone: 'ok' | 'warn' | 'bad'; log: string };

export default function KeepAliveAlignmentSimulator() {
  const [lbIdle, setLbIdle] = useState(60);
  const [tomcatKeepAlive, setTomcatKeepAlive] = useState(40);
  const [work, setWork] = useState(80);
  const [mode, setMode] = useState<Mode>('idle');

  const [t, setT] = useState(0);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [logMessage, setLogMessage] = useState('시뮬레이션 시작: 두 타이머가 각자 흐르는 중 (자동 재생)');

  const ref = useRef({ t, lbIdle, tomcatKeepAlive, mode, work });
  useEffect(() => {
    ref.current = { t, lbIdle, tomcatKeepAlive, mode, work };
  }, [t, lbIdle, tomcatKeepAlive, mode, work]);

  const restart = () => {
    setT(0);
    setOutcome(null);
    setLogMessage('요청 시작 ➔ 두 타이머가 각자 흐르는 중');
  };

  useEffect(() => {
    if (outcome) return undefined;

    const interval = setInterval(() => {
      const cur = ref.current;
      const next = cur.t + 1;

      if (cur.mode === 'inflight') {
        if (next >= cur.lbIdle && cur.work > cur.lbIdle) {
          setT(cur.lbIdle);
          setOutcome({
            badge: '504 GATEWAY TIMEOUT',
            tone: 'bad',
            log: `[LB] idle timeout ${cur.lbIdle}s 만료 ➔ 서버는 아직 처리 중. 클라이언트는 504, 서버는 뒤늦게 응답을 쓰다 Broken pipe 가 날 수 있음`,
          });
          return;
        }
        if (next >= cur.work) {
          setT(cur.work);
          setOutcome({
            badge: 'OK',
            tone: 'ok',
            log: `[Server] ${cur.work}s 만에 응답 완료 ➔ LB idle timeout 만료 전이라 정상 처리`,
          });
          return;
        }
        setT(next);
        return;
      }

      const first = Math.min(cur.lbIdle, cur.tomcatKeepAlive);
      if (next >= first) {
        setT(first);
        if (cur.tomcatKeepAlive < cur.lbIdle) {
          setOutcome({
            badge: '502 BAD GATEWAY',
            tone: 'bad',
            log: `[Tomcat] keep-alive ${cur.tomcatKeepAlive}s 로 먼저 닫음 ➔ LB 는 살아있다고 믿고 재사용 시도 ➔ 502`,
          });
        } else if (cur.tomcatKeepAlive === cur.lbIdle) {
          setOutcome({
            badge: 'RACE (경합)',
            tone: 'warn',
            log: `[Race] 두 값이 ${cur.lbIdle}s 로 동일 ➔ 서로 다른 프로세스라 어느 쪽이 먼저일지 보장할 수 없음`,
          });
        } else {
          setOutcome({
            badge: 'SAFE',
            tone: 'ok',
            log: `[LB] idle timeout ${cur.lbIdle}s 로 먼저 정리 ➔ 유휴 커넥션이라 사용자 요청 실패 없음`,
          });
        }
        return;
      }
      setT(next);
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [outcome]);

  useEffect(() => {
    if (outcome) setLogMessage(outcome.log);
  }, [outcome]);

  useEffect(() => {
    if (!outcome) return undefined;
    const timer = setTimeout(restart, 1900);
    return () => clearTimeout(timer);
  }, [outcome]);

  const max = Math.max(lbIdle, tomcatKeepAlive, mode === 'inflight' ? work : 0) + 10;

  const lane = (label: string, limit: number, kind: 'lb' | 'tomcat' | 'work') => {
    const fired = t >= limit;
    const palette = {
      lb: { border: 'border-amber-500 bg-amber-50/60 dark:border-amber-500/80 dark:bg-amber-950/30', badge: 'bg-amber-600 text-white', bar: 'bg-amber-500' },
      tomcat: { border: 'border-blue-500 bg-blue-50/60 dark:border-blue-500/80 dark:bg-blue-950/30', badge: 'bg-blue-600 text-white', bar: 'bg-blue-500' },
      work: { border: 'border-violet-500 bg-violet-50/60 dark:border-violet-500/80 dark:bg-violet-950/30', badge: 'bg-violet-600 text-white', bar: 'bg-violet-500' },
    }[kind];

    const neutral = 'border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-800/40';

    return (
      <div className={`relative flex flex-col justify-between rounded-lg border p-3.5 transition-all duration-300 ${fired ? palette.border : neutral}`}>
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">{label}</span>
          <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${fired ? palette.badge : 'bg-slate-400 text-white'}`}>
            {fired ? (kind === 'work' ? 'RESPONDED' : 'CLOSED') : 'RUNNING'}
          </span>
        </div>

        <div className="my-3 font-mono text-xs">
          <div className="text-slate-500 dark:text-slate-400 text-[11px]">Limit: {limit}s</div>
          <div className="text-slate-600 dark:text-slate-300 text-[11px]">Elapsed: {Math.min(t, limit)}s</div>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className={`h-full transition-all duration-100 ${fired ? palette.bar : 'bg-slate-400'}`}
            style={{ width: `${Math.min(100, (Math.min(t, limit) / max) * 100)}%` }}
          />
        </div>
      </div>
    );
  };

  const outcomeBadge = outcome && {
    ok: 'bg-emerald-600 text-white',
    warn: 'bg-amber-500 text-white',
    bad: 'bg-rose-600 text-white',
  }[outcome.tone];

  return (
    <div className="my-8 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/50 sm:px-6">
        <div className="flex rounded-lg bg-slate-200/80 p-0.5 text-xs font-semibold dark:bg-slate-800">
          {([['idle', '요청 사이 (유휴)'], ['inflight', '요청 처리 중']] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => { setMode(key); restart(); }}
              className={`rounded-md px-2.5 py-1 transition ${
                mode === key
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px]">
          <label className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-300">LB idle</span>
            <input
              type="range" min="10" max="120" step="5"
              value={lbIdle}
              onChange={(e) => { setLbIdle(parseInt(e.target.value, 10)); restart(); }}
              className="h-1 w-20 accent-amber-600"
            />
            <span className="w-[30px] text-slate-500 dark:text-slate-400">{lbIdle}s</span>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-300">keep-alive</span>
            <input
              type="range" min="10" max="120" step="5"
              value={tomcatKeepAlive}
              onChange={(e) => { setTomcatKeepAlive(parseInt(e.target.value, 10)); restart(); }}
              className="h-1 w-20 accent-blue-600"
            />
            <span className="w-[30px] text-slate-500 dark:text-slate-400">{tomcatKeepAlive}s</span>
          </label>
          {mode === 'inflight' && (
            <label className="flex items-center gap-2">
              <span className="text-slate-600 dark:text-slate-300">작업</span>
              <input
                type="range" min="10" max="150" step="5"
                value={work}
                onChange={(e) => { setWork(parseInt(e.target.value, 10)); restart(); }}
                className="h-1 w-20 accent-violet-600"
              />
              <span className="w-[30px] text-slate-500 dark:text-slate-400">{work}s</span>
            </label>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <span className="text-slate-500 dark:text-slate-400">누가 먼저 커넥션을 닫는가</span>
          <span className="rounded bg-slate-100 px-2 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {outcome ? (
              <span className={`rounded px-1.5 py-0.5 font-bold ${outcomeBadge}`}>{outcome.badge}</span>
            ) : (
              <>elapsed: {t}s</>
            )}
          </span>
        </div>

        <div className={`grid grid-cols-1 gap-3 ${mode === 'inflight' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
          {lane('로드밸런서 idle timeout', lbIdle, 'lb')}
          {lane('Tomcat keep-alive-timeout', tomcatKeepAlive, 'tomcat')}
          {mode === 'inflight' && lane('서버 응답 생성 시간', work, 'work')}
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 font-mono text-xs text-slate-200 dark:bg-black">
          <span className="text-emerald-400 font-bold">❯</span>
          <span className="truncate">{logMessage}</span>
        </div>
      </div>

      <div className="border-t border-slate-200 p-4 dark:border-slate-800 sm:p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <div className="mb-1 text-sm font-bold text-rose-600 dark:text-rose-400">Tomcat 이 먼저 닫으면</div>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              LB 가 아직 재사용 가능하다고 판단한 커넥션에 다음 요청이 겹치면 502 가 발생할 수 있다.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <div className="mb-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">LB 가 먼저 닫으면</div>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              요청이 끝난 유휴 keep-alive 커넥션이었다면 보통 사용자 요청 실패로 이어지지 않는다. 서버에 반드시 에러가 남는 것도 아니다.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <div className="mb-1 text-sm font-bold text-amber-600 dark:text-amber-400">같게 맞추면</div>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              두 타이머는 서로 다른 프로세스에서 독립적으로 흐르므로 경계 시점의 경합을 피하기 어렵다. 서버 쪽 keep-alive timeout 을 몇 초 이상 여유 있게 잡는 편이 안전하다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
