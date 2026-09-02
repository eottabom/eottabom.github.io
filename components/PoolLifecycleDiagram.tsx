'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Connection {
  id: number;
  state: 'available' | 'leased' | 'expired';
  requestCount: number;
}

export default function PoolLifecycleDiagram() {
  const [viewMode, setViewMode] = useState<'emulator' | 'fsm'>('emulator');
  const [connections, setConnections] = useState<Connection[]>([
    { id: 1, state: 'available', requestCount: 3 },
    { id: 2, state: 'available', requestCount: 1 },
    { id: 3, state: 'leased', requestCount: 5 },
    { id: 4, state: 'available', requestCount: 0 },
  ]);

  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [logMessage, setLogMessage] = useState('풀 초기화 완료: maxTotal=4, available=3, leased=1 (자동 시뮬레이션 실행 중)');
  const socketCounterRef = useRef(5);
  const autoStepRef = useRef(0);

  // 1. 요청 대여 (Borrow / Lease)
  const handleBorrow = () => {
    setConnections((prev) => {
      const availIndices = prev
        .map((c, idx) => (c.state === 'available' ? idx : -1))
        .filter((idx) => idx !== -1);

      if (availIndices.length === 0) {
        setLogMessage('대기 가능한 커넥션 없음 ➔ connectionRequestTimeout 동안 대기(blocking)');
        return prev;
      }

      // available 중 가장 오래 대기한(id가 가장 작은) 소켓 선택
      let targetIndex = availIndices[0];
      for (const idx of availIndices) {
        if (prev[idx].id < prev[targetIndex].id) {
          targetIndex = idx;
        }
      }

      const target = prev[targetIndex];
      setLogMessage(`[Borrow] Socket #${target.id} 대여 ➔ 애플리케이션에서 요청 처리 중 (Leased)`);
      const updated = [...prev];
      updated[targetIndex] = {
        ...target,
        state: 'leased',
        requestCount: target.requestCount + 1,
      };
      return updated;
    });
  };

  // 2. 요청 반납 (Release / Return)
  const handleRelease = () => {
    setConnections((prev) => {
      const leasedIndices = prev
        .map((c, idx) => (c.state === 'leased' ? idx : -1))
        .filter((idx) => idx !== -1);

      if (leasedIndices.length === 0) {
        setLogMessage('현재 사용 중(Leased)인 커넥션이 없습니다.');
        return prev;
      }

      const targetIndex = leasedIndices[0];
      const target = prev[targetIndex];
      setLogMessage(`[Release] connection.close() 호출 ➔ 소켓을 닫지 않고 풀로 반납 (Available)`);
      const updated = [...prev];
      updated[targetIndex] = { ...target, state: 'available' };
      return updated;
    });
  };

  // 3. 만료 및 회전 (Expire & Recycle) - 1단계: EXPIRED(빨간색 펄스) ➔ 2단계: 새 소켓 회전
  const handleExpire = () => {
    setConnections((prev) => {
      const availIndices = prev
        .map((c, idx) => (c.state === 'available' ? idx : -1))
        .filter((idx) => idx !== -1);

      if (availIndices.length === 0) {
        setLogMessage('유휴 상태의 커넥션이 없어 만료를 건너뜁니다.');
        return prev;
      }

      // available 커넥션들 중 가장 오래된(id가 가장 작은) 소켓 선택
      let oldestIndex = availIndices[0];
      for (const idx of availIndices) {
        if (prev[idx].id < prev[oldestIndex].id) {
          oldestIndex = idx;
        }
      }

      const target = prev[oldestIndex];
      setLogMessage(`[Expire] Socket #${target.id} max-lifetime 초과 ➔ 물리 소켓 닫힘 (EXPIRED)`);

      // 1단계: EXPIRED 상태로 전환 (빨간색 뱃지와 테두리 표시)
      const updated = [...prev];
      updated[oldestIndex] = {
        ...target,
        state: 'expired',
      };

      // 2단계: 1.2초 후 새 소켓으로 회전 생성
      const targetSlotIndex = oldestIndex;
      setTimeout(() => {
        const newId = socketCounterRef.current++;
        setConnections((current) => {
          const next = [...current];
          if (next[targetSlotIndex]?.state === 'expired') {
            next[targetSlotIndex] = {
              id: newId,
              state: 'available',
              requestCount: 0,
            };
            setLogMessage(`[Recycle] 새 Socket #${newId} 생성 완료 ➔ Available 대기`);
          }
          return next;
        });
      }, 1200);

      return updated;
    });
  };

  // 규칙적인 자동 시뮬레이션 루프 (대여 -> 반납 -> 만료(EXPIRED) -> 재생성 사이클)
  useEffect(() => {
    if (!isAutoPlay) return;

    const sequence = [
      () => handleBorrow(),
      () => handleBorrow(),
      () => handleRelease(),
      () => handleExpire(), // 만료 발생!
      () => handleRelease(),
      () => handleBorrow(),
      () => handleExpire(), // 만료 발생!
      () => handleRelease(),
    ];

    const interval = setInterval(() => {
      const action = sequence[autoStepRef.current % sequence.length];
      autoStepRef.current += 1;
      action();
    }, 2200);

    return () => clearInterval(interval);
  }, [isAutoPlay]);

  const leasedCount = connections.filter((c) => c.state === 'leased').length;
  const availableCount = connections.filter((c) => c.state === 'available').length;
  const expiredCount = connections.filter((c) => c.state === 'expired').length;

  return (
    <div className="my-8 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* 1. 상단 툴바 및 뷰 모드 탭 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/50 sm:px-6">
        <div className="flex items-center gap-2">
          {/* 뷰 전환 탭 버튼 */}
          <div className="flex rounded-lg bg-slate-200/80 p-0.5 text-xs font-semibold dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('emulator')}
              className={`rounded-md px-2.5 py-1 transition ${
                viewMode === 'emulator'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              실시간 에뮬레이터
            </button>
            <button
              type="button"
              onClick={() => setViewMode('fsm')}
              className={`rounded-md px-2.5 py-1 transition ${
                viewMode === 'fsm'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              상태 전이 다이어그램 (FSM)
            </button>
          </div>
        </div>

        {/* 에뮬레이터 모드일 때만 조작 버튼 표시 */}
        {viewMode === 'emulator' && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
            <button
              type="button"
              disabled={isAutoPlay}
              onClick={handleBorrow}
              className={`rounded-md bg-blue-600 px-3 py-1.5 sm:px-2.5 sm:py-1 text-white shadow-xs transition active:scale-95 ${
                isAutoPlay ? 'opacity-40 cursor-not-allowed' : 'hover:bg-blue-700'
              }`}
            >
              Borrow (대여)
            </button>
            <button
              type="button"
              disabled={isAutoPlay}
              onClick={handleRelease}
              className={`rounded-md bg-emerald-600 px-3 py-1.5 sm:px-2.5 sm:py-1 text-white shadow-xs transition active:scale-95 ${
                isAutoPlay ? 'opacity-40 cursor-not-allowed' : 'hover:bg-emerald-700'
              }`}
            >
              Release (반납)
            </button>
            <button
              type="button"
              disabled={isAutoPlay}
              onClick={handleExpire}
              className={`rounded-md bg-rose-600 px-3 py-1.5 sm:px-2.5 sm:py-1 text-white shadow-xs transition active:scale-95 ${
                isAutoPlay ? 'opacity-40 cursor-not-allowed' : 'hover:bg-rose-700'
              }`}
            >
              Expire (만료 회전)
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAutoPlay(!isAutoPlay);
                setLogMessage(!isAutoPlay ? '자동 시뮬레이션 시작 (Auto Play ON)' : '자동 시뮬레이션 일시정지 (수동 테스트 모드)');
              }}
              className={`rounded-md px-3 py-1.5 sm:px-2.5 sm:py-1 transition active:scale-95 font-semibold ${
                isAutoPlay
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
              }`}
            >
              {isAutoPlay ? '⏸ Pause (일시정지)' : '▶️ Auto Play (자동 재생)'}
            </button>
          </div>
        )}
      </div>

      {/* 2. 메인 뷰 컨텐츠 */}
      {viewMode === 'emulator' ? (
        /* 뷰 A: 실시간 소켓 에뮬레이터 */
        <div className="p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className="text-slate-500 dark:text-slate-400">
              Pool Capacity: 4 slots
            </span>
            <span className="rounded bg-slate-100 px-2 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              PoolStats [ <span className="font-bold text-emerald-600 dark:text-emerald-400">leased: {leasedCount}</span>; available: {availableCount}; {expiredCount > 0 && <span className="font-bold text-rose-600 dark:text-rose-400">expired: {expiredCount}; </span>}max: 4 ]
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {connections.map((conn) => {
              const isLeased = conn.state === 'leased';
              const isExpired = conn.state === 'expired';

              let borderColor = 'border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-800/40';
              let badgeBg = 'bg-blue-600 text-white';
              let badgeText = 'AVAILABLE';
              let statusDesc = 'idle (waiting)';
              let barColor = 'w-1/3 bg-blue-500';

              if (isLeased) {
                borderColor = 'border-emerald-500 bg-emerald-50/60 dark:border-emerald-500/80 dark:bg-emerald-950/30';
                badgeBg = 'bg-emerald-600 text-white';
                badgeText = 'LEASED';
                statusDesc = 'in-use (querying)';
                barColor = 'w-full bg-emerald-500';
              } else if (isExpired) {
                borderColor = 'border-rose-500 bg-rose-50/80 dark:border-rose-500/80 dark:bg-rose-950/40 animate-pulse';
                badgeBg = 'bg-rose-600 text-white';
                badgeText = 'EXPIRED';
                statusDesc = 'socket closed (폐기)';
                barColor = 'w-full bg-rose-500';
              }

              return (
                <div
                  key={conn.id}
                  className={`relative flex flex-col justify-between rounded-lg border p-3.5 transition-all duration-300 ${borderColor}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                      Socket #{conn.id}
                    </span>
                    <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${badgeBg}`}>
                      {badgeText}
                    </span>
                  </div>

                  <div className="my-3 font-mono text-xs">
                    <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                      Status: {statusDesc}
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 text-[11px]">
                      Requests: {conn.requestCount}
                    </div>
                  </div>

                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div className={`h-full transition-all duration-500 ${barColor}`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* 실시간 이벤트 로그 콘솔 */}
          <div className="mt-4 flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 font-mono text-xs text-slate-200 dark:bg-black">
            <span className="text-emerald-400 font-bold">❯</span>
            <span className="truncate">{logMessage}</span>
          </div>
        </div>
      ) : (
        /* 뷰 B: 겹침 없이 넉넉하고 정돈된 직교 FSM 아키텍처 다이어그램 */
        <div className="p-4 sm:p-6">
          <div className="mx-auto max-w-2xl">
            <svg
              viewBox="0 0 620 230"
              role="img"
              aria-label="커넥션 풀 FSM 상태 전이 다이어그램: Available, Leased, Expired"
              className="w-full h-auto select-none"
            >
              <defs>
                <marker id="fsm-arrow-num" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 2 L 7 5 L 0 8 z" fill="#64748b" />
                </marker>
              </defs>

              {/* 1. 수평 전이: 1) 대여: borrow() ➔ */}
              <line x1="180" y1="48" x2="432" y2="48" stroke="#64748b" strokeWidth="1.5" markerEnd="url(#fsm-arrow-num)" />
              <text x="310" y="39" textAnchor="middle" fontSize="12" fontWeight="600" fill="#334155" className="dark:fill-slate-200 font-mono">
                1) 대여: borrow() ➔
              </text>

              {/* 2. 수평 전이: ⇠ 2) 반납: release() / close() */}
              <line x1="440" y1="78" x2="188" y2="78" stroke="#64748b" strokeWidth="1.5" markerEnd="url(#fsm-arrow-num)" />
              <text x="310" y="96" textAnchor="middle" fontSize="12" fontWeight="600" fill="#334155" className="dark:fill-slate-200 font-mono">
                ⇠ 2) 반납: release() / close()
              </text>

              {/* 3. 하단 전이: 3) 만료: max-lifetime 초과 */}
              <path
                d="M 107.5 96 L 107.5 180 L 229.5 180"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                markerEnd="url(#fsm-arrow-num)"
              />
              <text x="115" y="136" textAnchor="start" fontSize="12" fontWeight="600" fill="#334155" className="dark:fill-slate-200 font-mono">
                3) 만료: max-lifetime 초과
              </text>

              {/* 4. 하단 전이: 4) 실패: liveness check 실패 */}
              <path
                d="M 512.5 96 L 512.5 180 L 390.5 180"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                markerEnd="url(#fsm-arrow-num)"
              />
              <text x="505" y="136" textAnchor="end" fontSize="12" fontWeight="600" fill="#334155" className="dark:fill-slate-200 font-mono">
                4) 실패: liveness check 실패
              </text>

              {/* --- 3개 상태 노드 박스 --- */}

              {/* Node 1: Available */}
              <g transform="translate(35, 28)">
                <rect width="145" height="68" rx="6" fill="#f8fafc" stroke="#475569" strokeWidth="1.5" className="dark:fill-slate-800 dark:stroke-slate-400" />
                <text x="72.5" y="29" textAnchor="middle" fontSize="15" fontWeight="700" fill="#0f172a" className="dark:fill-slate-100 font-mono">
                  Available
                </text>
                <text x="72.5" y="50" textAnchor="middle" fontSize="11.5" fill="#475569" className="dark:fill-slate-300">
                  풀 안에서 유휴 대기
                </text>
              </g>

              {/* Node 2: Leased */}
              <g transform="translate(440, 28)">
                <rect width="145" height="68" rx="6" fill="#f8fafc" stroke="#475569" strokeWidth="1.5" className="dark:fill-slate-800 dark:stroke-slate-400" />
                <text x="72.5" y="29" textAnchor="middle" fontSize="15" fontWeight="700" fill="#0f172a" className="dark:fill-slate-100 font-mono">
                  Leased
                </text>
                <text x="72.5" y="50" textAnchor="middle" fontSize="11.5" fill="#475569" className="dark:fill-slate-300">
                  애플리케이션 사용 중
                </text>
              </g>

              {/* Node 3: Expired */}
              <g transform="translate(237.5, 148)">
                <rect width="145" height="64" rx="6" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5 3" className="dark:fill-slate-800 dark:stroke-slate-500" />
                <text x="72.5" y="28" textAnchor="middle" fontSize="15" fontWeight="700" fill="#475569" className="dark:fill-slate-300 font-mono">
                  Expired
                </text>
                <text x="72.5" y="47" textAnchor="middle" fontSize="11.5" fill="#64748b" className="dark:fill-slate-400">
                  물리 소켓 폐기/교체
                </text>
              </g>
            </svg>
          </div>
        </div>
      )}

      {/* 3. 단정하고 직관적인 3단계 동작 가이드 타일 */}
      <div className="border-t border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/40 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200/80 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="text-sm font-bold text-blue-600 dark:text-blue-400 sm:text-base">
              1) 대여 (Borrow)
            </div>
            <div className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              AVAILABLE 소켓을 대여해 요청을 처리하고 LEASED 로 전이
            </div>
          </div>

          <div className="rounded-lg border border-slate-200/80 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 sm:text-base">
              2) 반납 (Release)
            </div>
            <div className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              close() 시 실제 소켓을 끊지 않고 AVAILABLE 로 풀에 재사용 반납
            </div>
          </div>

          <div className="rounded-lg border border-slate-200/80 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="text-sm font-bold text-rose-600 dark:text-rose-400 sm:text-base">
              3)·4) 만료 & 실패 회전 (Expire)
            </div>
            <div className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              max-lifetime 만료(3) 또는 liveness 실패(4) 시 기존 소켓을 닫고 새 소켓 번호로 안전하게 교체
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
