import React, { useState } from 'react';

type OS = 'mac' | 'win';
type KD = { id: string; mac: string; win: string; w: number };
type SC = { name: string; mac: string[]; win: string[] };
type Cat = { name: string; color: string; items: SC[] };

const K = (id: string, mac: string, win: string, w = 1): KD => ({ id, mac, win, w });
const S = (id: string, label: string, w = 1): KD => K(id, label, label, w);
const Gap = (id: string, w = 0.5): KD => K(id, '', '', w);

function resolveKeys(keys: string[], os: OS): Set<string> {
  const resolvedKeys = new Set<string>();

  keys.forEach((key) => {
    if (key === 'up' || key === 'down') {
      resolvedKeys.add('updown');
      return;
    }

    if (os !== 'win') {
      resolvedKeys.add(key);
      return;
    }

    if (key === 'ctrl') {
      resolvedKeys.add('fn');
      return;
    }

    if (key === 'alt') {
      resolvedKeys.add('cmd');
      return;
    }

    if (key === 'shift') {
      resolvedKeys.add('shift_l');
      resolvedKeys.add('shift_r');
      return;
    }

    resolvedKeys.add(key);
  });

  return resolvedKeys;
}

// ── Layout ───────────────────────────────────────────

const ROWS: KD[][] = [
  [K('esc','esc','Esc'), Gap('_g1'), S('f1','F1'), S('f2','F2'), S('f3','F3'), S('f4','F4'), Gap('_g2'), S('f5','F5'), S('f6','F6'), S('f7','F7'), S('f8','F8'), Gap('_g3'), S('f9','F9'), S('f10','F10'), S('f11','F11'), S('f12','F12')],
  [S('backtick','`'), S('1','1'), S('2','2'), S('3','3'), S('4','4'), S('5','5'), S('6','6'), S('7','7'), S('8','8'), S('9','9'), S('0','0'), S('minus','-'), S('equal','='), K('backspace','delete','Bksp',2)],
  [K('tab','tab','Tab',1.5), S('q','Q'), S('w','W'), S('e','E'), S('r','R'), S('t','T'), S('y','Y'), S('u','U'), S('i','I'), S('o','O'), S('p','P'), S('lbracket','['), S('rbracket',']'), S('backslash','\\',1.5)],
  [K('caps','caps','Caps',1.75), S('a','A'), S('s','S'), S('d','D'), S('f','F'), S('g','G'), S('h','H'), S('j','J'), S('k','K'), S('l','L'), S('semicolon',';'), S('quote',"'"), K('enter','return','Enter',2.25)],
  [K('shift_l','⇧','Shift',2.25), S('z','Z'), S('x','X'), S('c','C'), S('v','V'), S('b','B'), S('n','N'), S('m','M'), S('comma',','), S('period','.'), S('slash','/'), K('shift_r','⇧','Shift',2.75)],
];

const BOTTOM: Record<OS, KD[]> = {
  mac: [
    K('fn','fn','fn',1.25), K('ctrl','⌃','⌃',1.25), K('opt','⌥','⌥',1.25), K('cmd','⌘','⌘',1.5),
    S('space','',5.25),
    K('cmd_r','⌘','⌘',1.5), K('opt_r','⌥','⌥',1.25),
    S('left','←'), S('updown','↑↓'), S('right','→'),
  ],
  win: [
    K('fn','Ctrl','Ctrl',1.5), K('opt','Win','Win',1.25), K('cmd','Alt','Alt',1.5),
    S('space','',5.25),
    K('cmd_r','Alt','Alt',1.5), K('opt_r','Win','Win',1), K('ctrl_r','Ctrl','Ctrl',1.25),
    S('left','←'), S('updown','↑↓'), S('right','→'),
  ],
};

// ── Shortcuts ────────────────────────────────────────

const CATEGORIES: Cat[] = [
  { name: '핵심', color: '#f43f5e', items: [
    { name: '전체 검색', mac: ['shift_l','shift_r'], win: ['shift_l','shift_r'] },
    { name: 'Quick Fix', mac: ['opt','enter'], win: ['alt','enter'] },
    { name: '선언/사용처 이동', mac: ['cmd','b'], win: ['ctrl','b'] },
    { name: '이름 변경', mac: ['shift_l','f6'], win: ['shift','f6'] },
    { name: '코드 자동 정렬', mac: ['cmd','opt','l'], win: ['ctrl','alt','l'] },
    { name: '프로젝트 전체 검색', mac: ['cmd','shift_l','f'], win: ['ctrl','shift','f'] },
    { name: '구현부 이동', mac: ['cmd','opt','b'], win: ['ctrl','alt','b'] },
    { name: '주석 토글', mac: ['cmd','slash'], win: ['ctrl','slash'] },
    { name: '최근 파일', mac: ['cmd','e'], win: ['ctrl','e'] },
    { name: '뒤로 가기', mac: ['cmd','opt','left'], win: ['ctrl','alt','left'] },
  ]},
  { name: '검색', color: '#3b82f6', items: [
    { name: 'Search Everywhere', mac: ['shift_l','shift_r'], win: ['shift_l','shift_r'] },
    { name: '클래스 검색', mac: ['cmd','o'], win: ['ctrl','n'] },
    { name: '파일 검색', mac: ['cmd','shift_l','o'], win: ['ctrl','shift','n'] },
    { name: '전체 텍스트 검색', mac: ['cmd','shift_l','f'], win: ['ctrl','shift','f'] },
    { name: 'Action 검색', mac: ['cmd','shift_l','a'], win: ['ctrl','shift','a'] },
  ]},
  { name: '네비게이션', color: '#8b5cf6', items: [
    { name: '선언/사용처 이동', mac: ['cmd','b'], win: ['ctrl','b'] },
    { name: '구현부 이동', mac: ['cmd','opt','b'], win: ['ctrl','alt','b'] },
    { name: '이전 위치로', mac: ['cmd','opt','left'], win: ['ctrl','alt','left'] },
    { name: '최근 파일', mac: ['cmd','e'], win: ['ctrl','e'] },
    { name: '파일 구조', mac: ['cmd','f12'], win: ['ctrl','f12'] },
  ]},
  { name: '편집', color: '#10b981', items: [
    { name: '줄 복사', mac: ['cmd','d'], win: ['ctrl','d'] },
    { name: '코드 정렬', mac: ['cmd','opt','l'], win: ['ctrl','alt','l'] },
    { name: '주석 토글', mac: ['cmd','slash'], win: ['ctrl','slash'] },
    { name: 'Import 정리', mac: ['ctrl','opt','o'], win: ['ctrl','alt','o'] },
    { name: '줄 삭제', mac: ['cmd','x'], win: ['ctrl','y'] },
  ]},
  { name: '리팩터링', color: '#f59e0b', items: [
    { name: 'Rename', mac: ['shift_l','f6'], win: ['shift','f6'] },
    { name: 'Extract Variable', mac: ['cmd','opt','v'], win: ['ctrl','alt','v'] },
    { name: 'Extract Method', mac: ['cmd','opt','m'], win: ['ctrl','alt','m'] },
    { name: 'Extract Constant', mac: ['cmd','opt','c'], win: ['ctrl','alt','c'] },
    { name: 'Inline', mac: ['cmd','opt','n'], win: ['ctrl','alt','n'] },
  ]},
  { name: '실행/디버그', color: '#ef4444', items: [
    { name: 'Run', mac: ['ctrl','r'], win: ['shift','f10'] },
    { name: 'Debug', mac: ['ctrl','d'], win: ['shift','f9'] },
    { name: 'Breakpoint', mac: ['cmd','f8'], win: ['ctrl','f8'] },
    { name: 'Step Over', mac: ['f8'], win: ['f8'] },
    { name: 'Step Into', mac: ['f7'], win: ['f7'] },
  ]},
  { name: '코드 분석', color: '#ec4899', items: [
    { name: 'Quick Fix', mac: ['opt','enter'], win: ['alt','enter'] },
    { name: 'Find Usages', mac: ['opt','f7'], win: ['alt','f7'] },
    { name: '파라미터 정보', mac: ['cmd','p'], win: ['ctrl','p'] },
    { name: 'Quick Documentation', mac: ['f1'], win: ['ctrl','q'] },
  ]},
  { name: 'Git', color: '#06b6d4', items: [
    { name: 'Commit', mac: ['cmd','k'], win: ['ctrl','k'] },
    { name: 'Push', mac: ['cmd','shift_l','k'], win: ['ctrl','shift','k'] },
    { name: 'Pull / Update', mac: ['cmd','t'], win: ['ctrl','t'] },
  ]},
];

// ── Component ────────────────────────────────────────

export default function KeyboardVisual() {
  const [os, setOs] = useState<OS>('mac');
  const [catIdx, setCatIdx] = useState(0);
  const [scIdx, setScIdx] = useState(0);

  const cat = CATEGORIES[catIdx];
  const safe = Math.min(scIdx, cat.items.length - 1);
  const sc = cat.items[safe];
  const lit = resolveKeys(os === 'mac' ? sc.mac : sc.win, os);
  const rows = [...ROWS, BOTTOM[os]];

  return (
    <div style={{ margin: '28px 0' }}>
      {/* OS toggle */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, justifyContent: 'center' }}>
        {(['mac','win'] as OS[]).map(o => (
          <button key={o} type="button" onClick={() => { setOs(o); setScIdx(0); }} style={{
            padding: '7px 22px', borderRadius: 20, cursor: 'pointer',
            fontWeight: 600, fontSize: '0.85em',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            border: os === o ? '2px solid #4f46e5' : '2px solid #d1d5db',
            background: os === o ? '#4f46e5' : '#fff',
            color: os === o ? '#fff' : '#6b7280',
            transition: 'all 0.2s',
          }}>{o === 'mac' ? 'macOS' : 'Windows'}</button>
        ))}
      </div>

      {/* Keyboard */}
      <div style={{
        background: 'linear-gradient(170deg, #2a2a2c 0%, #1a1a1c 100%)',
        borderRadius: 16, padding: '16px 12px 12px',
        maxWidth: 720, margin: '0 auto',
        boxShadow: '0 12px 40px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)',
        border: '1px solid #383838',
        overflowX: 'auto' as const,
      }}>
        <div style={{ minWidth: 560 }}>
          {rows.map((row, ri) => (
            <div key={ri} style={{ display: 'flex', marginBottom: ri === 0 ? 8 : 0 }}>
              {row.map(key => {
                if (key.id.startsWith('_')) {
                  return <div key={key.id} style={{ flex: key.w, margin: 2 }} />;
                }
                const label = os === 'mac' ? key.mac : key.win;
                const on = lit.has(key.id);
                const isFn = ri === 0;
                const isSp = key.id === 'space';
                const single = label.length === 1;

                return (
                  <div key={key.id} style={{
                    flex: key.w,
                    height: isFn ? 28 : 38,
                    margin: 2,
                    borderRadius: 6,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: key.w > 1.5 ? '0.52em' : isFn ? '0.58em' : single ? '0.78em' : '0.6em',
                    fontWeight: single ? 600 : 500,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    cursor: 'default',
                    userSelect: 'none' as const,
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    position: 'relative' as const,
                    zIndex: on ? 2 : 1,
                    ...(on ? {
                      background: 'linear-gradient(135deg, #10b981 0%, #22c55e 50%, #4ade80 100%)',
                      color: '#fff',
                      border: '1px solid rgba(74,222,128,0.5)',
                      boxShadow: '0 0 20px rgba(34,197,94,0.45), 0 0 6px rgba(16,185,129,0.3), 0 2px 0 #047857, inset 0 1px 0 rgba(255,255,255,0.2)',
                      transform: 'translateY(-2px)',
                    } : {
                      background: isSp
                        ? 'linear-gradient(180deg, #333336, #2a2a2d)'
                        : 'linear-gradient(180deg, #4c4c50, #3c3c40)',
                      color: '#d4d4d8',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: '0 2px 0 #1a1a1c, inset 0 1px 0 rgba(255,255,255,0.07)',
                    }),
                  }}>{label}</div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Selected shortcut */}
      <div style={{ textAlign: 'center' as const, margin: '16px 0 20px', minHeight: 28 }}>
        <span style={{
          display: 'inline-block', padding: '5px 18px', borderRadius: 8,
          background: `${cat.color}14`, border: `1px solid ${cat.color}30`,
          fontSize: '0.9em', fontWeight: 600, color: '#374151',
        }}>{sc.name}</span>
      </div>

      {/* Categories */}
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, justifyContent: 'center', marginBottom: 10 }}>
        {CATEGORIES.map((c, i) => (
          <button key={i} type="button" onClick={() => { setCatIdx(i); setScIdx(0); }} style={{
            padding: '5px 14px', borderRadius: 16, cursor: 'pointer',
            fontWeight: 600, fontSize: '0.78em',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            border: catIdx === i ? `2px solid ${c.color}` : '2px solid transparent',
            background: catIdx === i ? `${c.color}15` : '#f3f4f6',
            color: catIdx === i ? c.color : '#9ca3af',
            transition: 'all 0.15s',
          }}>{c.name}</button>
        ))}
      </div>

      {/* Shortcuts — responsive 5-col grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {cat.items.map((item, i) => (
          <button key={i} type="button" onClick={() => setScIdx(i)} style={{
            padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
            fontWeight: 500, fontSize: '0.82em',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            border: safe === i ? `2px solid ${cat.color}` : '1px solid #e5e7eb',
            background: safe === i ? cat.color : '#fff',
            color: safe === i ? '#fff' : '#4b5563',
            transition: 'all 0.15s',
            textAlign: 'center' as const,
            whiteSpace: 'nowrap' as const,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>{item.name}</button>
        ))}
      </div>

      <div style={{
        textAlign: 'center' as const, marginTop: 14,
        fontSize: '0.75em', color: '#9ca3af',
      }}>
        카테고리와 단축키를 클릭하면 키보드에서 해당 키가 하이라이트됩니다
      </div>
    </div>
  );
}
