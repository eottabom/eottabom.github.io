import React, { useState, useEffect, useRef } from 'react';

// --- 설정 및 상수 ---
const REGION_COUNT = 40; // 8x5 그리드
const REGION_SIZE_MB = 2.0; // 1개 리전 크기를 2MB로 가정 (1MB 이상이면 Humongous)

const COLORS = {
  F: { base: '#ffffff', fill: '#ffffff', text: '#374151' },
  E: { base: '#dcfce7', fill: '#22c55e', text: '#ffffff' }, // 초록색 계열
  S: { base: '#fef08a', fill: '#eab308', text: '#ffffff' }, // 노란색 계열
  O: { base: '#bfdbfe', fill: '#3b82f6', text: '#ffffff' }, // 파란색 계열
  H: { base: '#fecaca', fill: '#ef4444', text: '#ffffff' }, // 빨간색 계열
};

interface Region {
  id: number;
  type: 'F' | 'E' | 'S' | 'O' | 'H';
  fill: number;
  age: number;
}

interface Stats {
  youngGC: number;
}

export default function G1GCSimulator() {
  // 상태 관리
  const [regions, setRegions] = useState<Region[]>(() =>
    Array(REGION_COUNT).fill(null).map((_, i) => ({ id: i, type: 'F', fill: 0, age: 0 }))
  );
  const [stats, setStats] = useState<Stats>({ youngGC: 0 });
  const [objectSize, setObjectSize] = useState(0.8); // MB
  const [allocationSpeed, setAllocationSpeed] = useState(2); // 초당 할당 횟수 (1~10)

  // 최신 상태를 ref로 관리 (setInterval 안에서 접근하기 위함)
  const stateRef = useRef({ regions, objectSize });
  useEffect(() => { stateRef.current = { regions, objectSize }; }, [regions, objectSize]);

  // --- 1. 객체 할당 로직 ---
  const allocate = () => {
    const currentRegions = [...stateRef.current.regions];
    const currentSize = stateRef.current.objectSize;

    // [Humongous 할당] 리전 크기의 50% (1MB) 이상인 경우
    if (currentSize >= REGION_SIZE_MB / 2) {
      const neededRegions = Math.ceil(currentSize / REGION_SIZE_MB);
      let consecutiveFree = 0;
      let startIndex = -1;

      // 연속된 F 리전 찾기
      for (let i = 0; i < currentRegions.length; i++) {
        if (currentRegions[i].type === 'F') {
          if (consecutiveFree === 0) startIndex = i;
          consecutiveFree++;
          if (consecutiveFree === neededRegions) break;
        } else {
          consecutiveFree = 0;
        }
      }

      if (consecutiveFree === neededRegions) {
        for (let i = startIndex; i < startIndex + neededRegions; i++) {
          currentRegions[i] = { ...currentRegions[i], type: 'H', fill: 100 };
        }
        setRegions(currentRegions);
      } else {
        // 공간 부족 시 강제 GC (실제론 Full GC 유발)
        triggerGC(currentRegions);
      }
      return;
    }

    // [일반 할당 (Eden)]
    // 현재 사용 중인 Eden 중 공간이 남은 곳 찾기
    let targetIndex = currentRegions.findIndex(r => r.type === 'E' && r.fill < 100);

    // 남은 곳이 없으면 새로운 빈 리전을 Eden으로 만듦
    if (targetIndex === -1) {
      targetIndex = currentRegions.findIndex(r => r.type === 'F');
      if (targetIndex !== -1) {
        currentRegions[targetIndex] = { ...currentRegions[targetIndex], type: 'E', fill: 0, age: 0 };
      }
    }

    // 빈 리전조차 없다면 GC 트리거
    if (targetIndex === -1) {
      triggerGC(currentRegions);
      return;
    }

    // 찾은 Eden 영역에 객체 용량 채우기
    const fillAmount = (currentSize / REGION_SIZE_MB) * 100;
    const newFill = Math.min(100, currentRegions[targetIndex].fill + fillAmount);
    currentRegions[targetIndex] = { ...currentRegions[targetIndex], fill: newFill };

    // Eden 영역이 너무 많아지면(예: 8개 이상) GC 트리거
    const edenCount = currentRegions.filter(r => r.type === 'E').length;
    if (edenCount >= 8 && newFill >= 100) {
       triggerGC(currentRegions);
    } else {
       setRegions(currentRegions);
    }
  };

  // --- 2. GC 실행 로직 (Young GC 중심) ---
  const triggerGC = (currentRegionsState: Region[] = regions) => {
    const nextRegions: Region[] = currentRegionsState.map(r => {
      if (r.type === 'E') {
        // Eden은 무조건 비워짐 (생존 객체는 Survivor로 간다고 가정하고 시각적 간소화)
        // 일부만 S로 남김 (1/3 확률)
        if (Math.random() > 0.6) {
          return { ...r, type: 'S', fill: 50, age: 1 } as Region;
        }
        return { ...r, type: 'F', fill: 0, age: 0 } as Region;
      } else if (r.type === 'S') {
        // S는 나이가 차면 O로 승격 (Promotion)
        if (r.age >= 3) {
          return { ...r, type: 'O', fill: 80, age: 0 } as Region;
        }
        // 살아남은 S (나이 증가)
        if (Math.random() > 0.3) {
           return { ...r, age: r.age + 1 } as Region;
        }
        // 죽은 S
        return { ...r, type: 'F', fill: 0, age: 0 } as Region;
      } else if (r.type === 'H') {
        // 거대 객체도 일정 확률로 회수됨
        if (Math.random() > 0.7) {
           return { ...r, type: 'F', fill: 0, age: 0 } as Region;
        }
      }
      return r;
    });

    setRegions(nextRegions);
    setStats(prev => ({ youngGC: prev.youngGC + 1 }));
  };

  // --- 3. 자동 할당 타이머 (Speed에 따름) ---
  useEffect(() => {
    if (allocationSpeed <= 0) return;
    const intervalMs = 1000 / allocationSpeed;
    const timer = setInterval(allocate, intervalMs);
    return () => clearInterval(timer);
  }, [allocationSpeed]);


  // 통계 집계
  const counts = { E: 0, S: 0, O: 0, H: 0, F: 0 };
  regions.forEach(r => { counts[r.type]++; });

  return (
    <div className="p-4 sm:p-6 bg-slate-50 rounded-xl border border-slate-200 font-sans">

      {/* 헤더 */}
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">G1GC Region Simulator</h2>

      {/* 통계 */}
      <div className="grid grid-cols-5 gap-2 mb-5 text-center">
        {[
          { label: 'EDEN', value: counts.E, color: COLORS.E.fill },
          { label: 'SURV', value: counts.S, color: COLORS.S.fill },
          { label: 'OLD', value: counts.O, color: COLORS.O.fill },
          { label: 'HUGE', value: counts.H, color: COLORS.H.fill },
          { label: 'GC', value: stats.youngGC, color: '#6b7280' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-lg py-2 px-1 border border-slate-200">
            <div className="text-xs font-semibold text-gray-500 mb-1 truncate">{label}</div>
            <div className="text-base sm:text-lg font-bold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* 리전 그리드 */}
      <div className="grid gap-1 mb-4" style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}>
        {regions.map((region) => {
          const colorConfig = COLORS[region.type];
          const background = region.type === 'F'
            ? colorConfig.base
            : `linear-gradient(to top, ${colorConfig.fill} ${region.fill}%, ${colorConfig.base} ${region.fill}%)`;

          return (
            <div key={region.id} style={{
              background,
              color: region.type === 'F' ? colorConfig.text : (region.fill > 50 ? '#fff' : '#000'),
              border: `1px solid ${region.type === 'F' ? '#d1d5db' : colorConfig.fill}`,
              transition: 'background 0.2s ease',
            }} className="h-8 sm:h-12 flex items-center justify-center font-bold text-xs rounded">
              {region.type}
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-600 mb-6">
        {[
          { label: 'Eden', color: COLORS.E.fill },
          { label: 'Survivor', color: COLORS.S.fill },
          { label: 'Old', color: COLORS.O.fill },
          { label: 'Humongous', color: COLORS.H.fill },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: color }} />
            {label}
          </div>
        ))}
      </div>

      {/* 컨트롤 패널 */}
      <div className="bg-slate-100 p-4 rounded-lg flex flex-col gap-4">

        {/* Object Size Slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-700">Object Size (MB)</label>
            <span className="text-sm font-bold text-gray-900 bg-white border border-slate-300 rounded-full px-3 py-0.5 min-w-[52px] text-center">
              {objectSize.toFixed(1)}
            </span>
          </div>
          <input
            type="range" min="0.1" max="4.0" step="0.1"
            value={objectSize}
            onChange={(e) => setObjectSize(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Allocation Speed Slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-700">Allocation Speed</label>
            <span className="text-sm font-bold text-gray-900 bg-white border border-slate-300 rounded-full px-3 py-0.5 min-w-[52px] text-center">
              {allocationSpeed}
            </span>
          </div>
          <input
            type="range" min="0" max="10" step="1"
            value={allocationSpeed}
            onChange={(e) => setAllocationSpeed(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Force GC Button */}
        <button
          onClick={() => triggerGC(regions)}
          className="w-full py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-full text-sm transition-colors"
        >
          Force GC
        </button>
      </div>

    </div>
  );
}
