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
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', fontFamily: 'sans-serif' }}>

      {/* 헤더 & 통계 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>G1GC Region Simulator</h2>
        <div style={{ display: 'flex', gap: '24px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#4b5563' }}>
          <div><div style={{ marginBottom: '4px' }}>EDEN</div><div style={{ fontSize: '1.1rem', color: '#111827' }}>{counts.E}</div></div>
          <div><div style={{ marginBottom: '4px' }}>SURVIVOR</div><div style={{ fontSize: '1.1rem', color: '#111827' }}>{counts.S}</div></div>
          <div><div style={{ marginBottom: '4px' }}>OLD</div><div style={{ fontSize: '1.1rem', color: '#111827' }}>{counts.O}</div></div>
          <div><div style={{ marginBottom: '4px' }}>HUMONGOUS</div><div style={{ fontSize: '1.1rem', color: '#111827' }}>{counts.H}</div></div>
          <div><div style={{ marginBottom: '4px' }}>YOUNG GC</div><div style={{ fontSize: '1.1rem', color: '#111827' }}>{stats.youngGC}</div></div>
        </div>
      </div>

      {/* 리전 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '6px', marginBottom: '16px' }}>
        {regions.map((region) => {
          const colorConfig = COLORS[region.type];
          // 부분 채움 효과 (css linear-gradient)
          const background = region.type === 'F'
            ? colorConfig.base
            : `linear-gradient(to top, ${colorConfig.fill} ${region.fill}%, ${colorConfig.base} ${region.fill}%)`;

          return (
            <div key={region.id} style={{
              height: '48px',
              background: background,
              color: region.type === 'F' ? colorConfig.text : (region.fill > 50 ? '#fff' : '#000'), // 대비 조절
              border: `1px solid ${region.type === 'F' ? '#d1d5db' : colorConfig.fill}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              borderRadius: '4px',
              transition: 'background 0.2s ease',
              position: 'relative'
            }}>
              <span style={{ zIndex: 10 }}>{region.type}</span>
            </div>
          );
        })}
      </div>

      {/* 범례 (Legend) */}
      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#4b5563', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLORS.E.fill }}></span> Eden</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLORS.S.fill }}></span> Survivor</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLORS.O.fill }}></span> Old</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLORS.H.fill }}></span> Humongous</div>
      </div>

      {/* 하단 컨트롤 패널 */}
      <div style={{ backgroundColor: '#f1f5f9', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          {/* Object Size Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '300px' }}>
            <label style={{ fontSize: '14px', color: '#333', whiteSpace: 'nowrap' }}>Object Size (MB)</label>
            <input
              type="range" min="0.1" max="4.0" step="0.1"
              value={objectSize}
              onChange={(e) => setObjectSize(parseFloat(e.target.value))}
              style={{ flex: 1 }}
            />
            <div style={{ padding: '4px 12px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '16px', fontWeight: 'bold', minWidth: '50px', textAlign: 'center' }}>
              {objectSize.toFixed(1)}
            </div>
          </div>

          {/* Allocation Speed Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '300px' }}>
            <label style={{ fontSize: '14px', color: '#333', whiteSpace: 'nowrap' }}>Allocation Speed</label>
            <input
              type="range" min="0" max="10" step="1"
              value={allocationSpeed}
              onChange={(e) => setAllocationSpeed(parseInt(e.target.value))}
              style={{ flex: 1 }}
            />
            <div style={{ padding: '4px 16px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '16px', fontWeight: 'bold', minWidth: '50px', textAlign: 'center' }}>
              {allocationSpeed}
            </div>
          </div>
        </div>

        {/* Force GC Button */}
        <button
          onClick={() => triggerGC(regions)}
          style={{ width: '100%', padding: '12px', backgroundColor: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '24px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', transition: 'background 0.2s' }}
          onMouseOver={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#cbd5e1'}
          onMouseOut={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#e2e8f0'}
        >
          Force GC
        </button>
      </div>

    </div>
  );
}
