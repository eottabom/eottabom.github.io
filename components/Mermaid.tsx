import { useEffect, useId, useState } from 'react';

interface MermaidProps {
  chart: string;
  'data-src'?: string;
}

let initialized = false;

// 참여자(상자)마다 돌아가며 쓰는 파스텔 색. [배경, 테두리]
const ACTOR_PALETTE: ReadonlyArray<readonly [string, string]> = [
  ['#fdf4ff', '#e879f9'],
  ['#f0fdfa', '#5eead4'],
  ['#fff7ed', '#fb923c'],
  ['#ecfeff', '#67e8f9'],
  ['#f0fdf4', '#86efac'],
  ['#eef2ff', '#a5b4fc'],
];

// mermaid 테마로는 참여자별 색을 줄 수 없어서, 그려진 SVG 에서 등장 순서(actor0, actor1 ...)대로 색을 입힌다.
// 위쪽, 아래쪽 상자는 같은 name 이라 같은 색이 된다.
const colorizeActors = (svg: string): string => {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const order = new Map<string, number>();
  doc.querySelectorAll('line.actor-line').forEach((line) => {
    const name = line.getAttribute('name');
    const index = Number((line.getAttribute('id') ?? '').replace('actor', ''));
    if (name != null && !Number.isNaN(index)) order.set(name, index);
  });
  doc.querySelectorAll('rect.actor').forEach((rect) => {
    const index = order.get(rect.getAttribute('name') ?? '');
    if (index == null) return;
    const [fill, stroke] = ACTOR_PALETTE[index % ACTOR_PALETTE.length];
    // SVG 안의 mermaid 스타일시트(.actor { fill }) 가 속성보다 우선해서, 인라인 style 로 넣는다.
    rect.setAttribute('style', `fill: ${fill}; stroke: ${stroke}; stroke-width: 2px;`);
    rect.setAttribute('rx', '6');
    rect.setAttribute('ry', '6');
  });
  // 모바일에서 화면 폭에 맞춰 통째로 줄어들지 않도록 원래 폭을 CSS 변수로 넘긴다 (globals.css 의 .mermaid-diagram svg).
  const root = doc.documentElement;
  const naturalWidth = Number(root.getAttribute('viewBox')?.split(/\s+/)[2]);
  if (naturalWidth > 0) {
    root.setAttribute('style', `${root.getAttribute('style') ?? ''} --mermaid-width: ${Math.ceil(naturalWidth)}px;`);
  }
  return new XMLSerializer().serializeToString(root);
};

// mermaid 라이브러리는 크기가 커서, 이 컴포넌트가 화면에 나올 때만 브라우저에서 불러온다.
// 그리기 전과 실패했을 때는 원본 코드를 보여줘서 내용이 비지 않게 한다.
export default function Mermaid({ chart, 'data-src': dataSrc }: MermaidProps) {
  const renderId = `mermaid-${useId().replace(/:/g, '')}`;
  const [svg, setSvg] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const draw = async (): Promise<void> => {
      const { default: mermaid } = await import('mermaid');
      if (!initialized) {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          // 참여자 색은 colorizeActors 에서 따로 입히고, 여기서는 선, 글자, 메모 색만 정한다.
          theme: 'base',
          themeVariables: {
            fontFamily: "'Inter', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
            fontSize: '15px',
            primaryColor: '#f8fafc',
            primaryBorderColor: '#94a3b8',
            primaryTextColor: '#1f2937',
            lineColor: '#1f2937',
            textColor: '#1f2937',
            actorTextColor: '#1f2937',
            actorLineColor: '#334155',
            signalColor: '#1f2937',
            signalTextColor: '#1f2937',
            noteBkgColor: '#fef9c3',
            noteBorderColor: '#fde047',
            noteTextColor: '#374151',
          },
        });
        initialized = true;
      }
      const result = await mermaid.render(renderId, chart);
      if (!cancelled) setSvg(colorizeActors(result.svg));
    };

    draw().catch((error: unknown) => {
      console.error('Mermaid 그림을 그리지 못했습니다:', error);
      if (!cancelled) setFailed(true);
    });

    return () => {
      cancelled = true;
    };
  }, [chart, renderId]);

  if (svg) {
    return (
      <figure className="mermaid-diagram" data-src={dataSrc} dangerouslySetInnerHTML={{ __html: svg }} />
    );
  }

  return (
    <figure className="mermaid-diagram mermaid-diagram--pending" data-src={dataSrc}>
      {failed && <figcaption className="mermaid-diagram__error">다이어그램을 그리지 못해 원본을 표시합니다.</figcaption>}
      <pre>
        <code>{chart}</code>
      </pre>
    </figure>
  );
}
