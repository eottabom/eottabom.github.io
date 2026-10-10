'use client';

import React, { useState } from 'react';

// Pod limits 와 JVM 옵션에 따라 HotSpot ergonomics 가 고르는 기본 GC, GC worker 수, 최대 Heap 을 보여준다.
// 계산식은 HotSpot(gcConfig.cpp, os.cpp, g1Arguments.cpp)과 Temurin 8, 11, 17, 21 Pod 측정 결과를 따른다.

const CPU_OPTIONS = [0.5, 1, 2, 4, 8] as const;
const MEMORY_OPTIONS = [512, 1024, 1791, 1792, 2048, 4096] as const;
const SERVER_CLASS_MEMORY_MIB = 1792;
const MAX_RAM_PERCENTAGE = 25;

const JDK_OPTIONS = [8, 11, 17, 21, 27] as const;

type Jdk = (typeof JDK_OPTIONS)[number];

const formatMemory = (mib: number) => (mib >= 1024 && mib % 1024 === 0 ? `${mib / 1024}Gi` : `${mib}Mi`);
const formatHeap = (mib: number) => (mib >= 1024 && mib % 1024 === 0 ? `${mib / 1024}G` : `${mib}M`);

function parallelGcThreads(cpus: number) {
  return cpus <= 8 ? cpus : 8 + Math.floor(((cpus - 8) * 5) / 8);
}

export default function JvmErgonomicsSimulator() {
  const [cpuLimit, setCpuLimit] = useState<number>(1);
  const [memoryMib, setMemoryMib] = useState<number>(1024);
  const [jdk, setJdk] = useState<Jdk>(21);
  const [useG1, setUseG1] = useState(false);
  const [apc2, setApc2] = useState(false);

  const cpus = apc2 ? 2 : Math.ceil(cpuLimit);
  const serverClass = cpus >= 2 && memoryMib >= SERVER_CLASS_MEMORY_MIB;
  // JDK 8 은 server-class 면 Parallel, JDK 9~26 은 G1, JDK 27 부터는 항상 G1 이다.
  const gc = useG1 || jdk === 27 ? 'G1' : !serverClass ? 'Serial' : jdk === 8 ? 'Parallel' : 'G1';
  const heapMib = Math.ceil((memoryMib * MAX_RAM_PERCENTAGE) / 100);
  const parallel = parallelGcThreads(cpus);
  const concurrent = Math.max(Math.floor((parallel + 2) / 4), 1);

  let reason: string;
  if (useG1) {
    reason = '-XX:+UseG1GC 로 명시했으므로 리소스와 상관없이 G1';
  } else if (jdk === 27) {
    reason = 'JDK 27 (JEP 523) 부터는 리소스와 상관없이 항상 G1';
  } else if (serverClass) {
    reason = `CPU ${cpus}개 ≥ 2, 메모리 ${memoryMib}MiB ≥ 1792MiB → server-class → ${gc}`;
  } else {
    const missing = [cpus < 2 && `CPU ${cpus}개 < 2`, memoryMib < SERVER_CLASS_MEMORY_MIB && `메모리 ${memoryMib}MiB < 1792MiB`]
      .filter(Boolean)
      .join(', ');
    reason = `${missing} → server-class 아님 → Serial`;
  }

  const preset = (cpu: number, memory: number) => {
    setCpuLimit(cpu);
    setMemoryMib(memory);
    setUseG1(false);
    setApc2(false);
    setJdk(21);
  };

  const segment = <T extends number>(values: readonly T[], current: number, onSelect: (value: T) => void, label: (value: T) => string) => (
    <div className="flex flex-wrap rounded-lg bg-slate-200/80 p-0.5 text-xs font-semibold dark:bg-slate-800">
      {values.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onSelect(value)}
          className={`rounded-md px-2.5 py-1 font-mono transition ${
            current === value
              ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-slate-100'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          {label(value)}
        </button>
      ))}
    </div>
  );

  const toggle = (checked: boolean, onChange: (value: boolean) => void, label: string) => (
    <label className="flex cursor-pointer items-center gap-1.5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-blue-600" />
      {label}
    </label>
  );

  const result = (label: string, value: string, detail: string, tone: 'neutral' | 'g1' | 'parallel' | 'serial' = 'neutral') => {
    const palette = {
      neutral: 'border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-800/40',
      g1: 'border-emerald-500 bg-emerald-50/60 dark:border-emerald-500/80 dark:bg-emerald-950/30',
      parallel: 'border-amber-500 bg-amber-50/60 dark:border-amber-500/80 dark:bg-amber-950/30',
      serial: 'border-rose-500 bg-rose-50/60 dark:border-rose-500/80 dark:bg-rose-950/30',
    }[tone];
    const valueColor = {
      neutral: 'text-slate-900 dark:text-slate-100',
      g1: 'text-emerald-600 dark:text-emerald-400',
      parallel: 'text-amber-600 dark:text-amber-400',
      serial: 'text-rose-600 dark:text-rose-400',
    }[tone];
    return (
      <div className={`rounded-lg border p-3.5 transition-all duration-300 ${palette}`}>
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</div>
        <div className={`mt-1 font-mono text-xl font-bold ${valueColor}`}>{value}</div>
        <div className="mt-1 font-mono text-[11px] text-slate-500 dark:text-slate-400">{detail}</div>
      </div>
    );
  };

  // 실제 JVM 로그처럼 보이지 않도록 PrintFlagsFinal 플래그 이름으로 계산 결과만 보여준다.
  const flagLines = [
    `${`Use${gc}GC`.padEnd(21)}= true`,
    `ActiveProcessorCount = ${apc2 ? 2 : '-1 (자동 → ' + cpus + ')'}`,
    `MaxHeapSize          = ${formatHeap(heapMib)}`,
    ...(gc !== 'Serial' ? [`ParallelGCThreads    = ${parallel}`] : []),
    ...(gc === 'G1' ? [`ConcGCThreads        = ${concurrent}`] : []),
  ];

  return (
    <div className="my-8 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="space-y-3 border-b border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/50 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">limits.cpu</span>
            {segment(CPU_OPTIONS, cpuLimit, setCpuLimit, (value) => (value < 1 ? `${value * 1000}m` : `${value}`))}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">limits.memory</span>
            {segment(MEMORY_OPTIONS, memoryMib, setMemoryMib, formatMemory)}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">JDK</span>
            {segment(JDK_OPTIONS, jdk, (value) => setJdk(value), (value) => `${value}`)}
          </div>
          {toggle(useG1, setUseG1, '-XX:+UseG1GC')}
          {toggle(apc2, setApc2, '-XX:ActiveProcessorCount=2')}
          <div className="ml-auto flex gap-1.5 text-[11px] font-semibold">
            <button type="button" onClick={() => preset(8, 4096)} className="rounded-md border border-slate-300 px-2 py-1 text-slate-600 hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              변경 전 cpu 8, mem 4Gi
            </button>
            <button type="button" onClick={() => preset(1, 1024)} className="rounded-md border border-slate-300 px-2 py-1 text-slate-600 hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              변경 후 cpu 1, mem 1Gi
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          {result('JVM이 인식한 CPU', `${cpus}개`, apc2 ? 'ActiveProcessorCount' : `ceil(${cpuLimit})`)}
          {result('기본 GC', gc, useG1 ? '명시' : jdk === 27 ? 'JDK 27 기본값' : serverClass ? 'server-class' : 'server-class 아님', gc === 'G1' ? 'g1' : gc === 'Parallel' ? 'parallel' : 'serial')}
          {result(
            'GC worker',
            gc === 'G1' ? `${parallel} / ${concurrent}` : gc === 'Parallel' ? `${parallel}` : '-',
            gc === 'G1' ? 'Parallel / Concurrent' : gc === 'Parallel' ? 'Parallel' : 'Serial은 단일 스레드 GC',
          )}
          {result('최대 Heap (MaxHeapSize)', formatHeap(heapMib), `${formatMemory(memoryMib)} × ${MAX_RAM_PERCENTAGE}%`)}
        </div>

        <div className="mt-4 rounded-md bg-slate-900 px-3 py-2.5 font-mono text-xs leading-relaxed text-slate-200 dark:bg-black">
          <div className="mb-1 text-slate-500"># JDK {jdk} 기준 계산 결과 (실제 JVM 출력 아님)</div>
          <div className="mb-1 flex items-center gap-2">
            <span className="font-bold text-emerald-400">❯</span>
            <span className="text-slate-400">{reason}</span>
          </div>
          {flagLines.map((line) => (
            <div key={line} className="whitespace-pre text-slate-300">{line}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
