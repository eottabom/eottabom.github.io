import React, { ReactNode } from 'react';

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd
      style={{
        display: 'inline-block',
        padding: '3px 8px',
        fontSize: '0.8em',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontWeight: 600,
        lineHeight: 1.4,
        color: '#1a1a2e',
        backgroundColor: '#f8f9fa',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        boxShadow: '0 2px 0 #d1d5db, 0 3px 1px rgba(0,0,0,0.06)',
        whiteSpace: 'nowrap' as const,
        verticalAlign: 'middle',
        margin: '0 2px',
        minWidth: '24px',
        textAlign: 'center' as const,
      }}
    >
      {children}
    </kbd>
  );
}

export function KeyCombo({ keys, children }: { keys?: string; children?: React.ReactNode }) {
  if (!keys) {
    return <span>{children}</span>;
  }
  const keyList = keys.split(' ');
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', flexWrap: 'wrap' as const }}>
      {keyList.map((key, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          {i > 0 && (
            <span style={{ color: '#9ca3af', fontSize: '0.75em', fontWeight: 700 }}>+</span>
          )}
          <Kbd>{key}</Kbd>
        </span>
      ))}
    </span>
  );
}

export function TopShortcut({ num, title, mac, win }: { num: string; title: string; mac: string; win?: string }) {
  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        backgroundColor: '#ffffff',
        display: 'flex',
        gap: '14px',
        alignItems: 'flex-start',
        transition: 'box-shadow 0.15s',
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.8em',
          fontWeight: 700,
        }}
      >
        {num}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.95em', color: '#1f2937', marginBottom: '8px' }}>
          {title}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.7em',
                fontWeight: 600,
                color: '#6b7280',
                backgroundColor: '#f3f4f6',
                padding: '1px 6px',
                borderRadius: '4px',
                minWidth: '24px',
                textAlign: 'center' as const,
              }}
            >
              Mac
            </span>
            <KeyCombo keys={mac} />
          </div>
          {win && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '0.7em',
                  fontWeight: 600,
                  color: '#6b7280',
                  backgroundColor: '#f3f4f6',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  minWidth: '24px',
                  textAlign: 'center' as const,
                }}
              >
                Win
              </span>
              <KeyCombo keys={win} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
