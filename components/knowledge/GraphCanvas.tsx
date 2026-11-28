import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import { Minus, Plus, Scan } from 'lucide-react';
import { ARTICLE_COLOR, CATEGORY_COLORS, categoryColor } from '../../lib/knowledge/colors';
import { edgeCurve, layoutSubgraph } from '../../lib/knowledge/layout';
import type { PlacedPosition } from '../../lib/knowledge/layout';
import { ALL_HUB_ID } from '../../lib/knowledge/subgraph';
import type { Subgraph, SubgraphNode } from '../../lib/knowledge/subgraph';

// Cytoscape 를 다루는 유일한 컴포넌트. 페이지에서 next/dynamic 으로 ssr: false 로만 불러서,
// 서버 렌더링과 다른 페이지의 번들에는 Cytoscape 가 들어가지 않는다.

const FONT_FAMILY = "Inter, -apple-system, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif";
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.5;
const FIT_PADDING = 48;
// 이 배율보다 작아지면 글 라벨을 숨긴다.
const LABEL_ZOOM_THRESHOLD = 0.4;
const DOUBLE_TAP_MS = 320;
// 끌 때 이웃이 따라오는 비율. 1단계 이웃은 크게, 2단계 이웃은 살짝 따라온다.
const FIRST_FOLLOW = 0.45;
const SECOND_FOLLOW = 0.15;
// 놓았을 때 이웃이 제자리로 돌아가는 탄성, 새 화면에서 노드가 퍼지는 시간
const RETURN_DURATION_MS = 650;
const ENTER_DURATION_MS = 550;
const HUB_IMAGE = '/img/knowledge/hub-cat-laptop.webp';
const ZOOM_STEP = 1.25;

// 색은 노드에만 쓰고 선은 옅은 회색으로 둔다. 관계 종류는 색이 아니라 선 모양(점선, 화살표)으로 구분한다.
const CONCEPT_EDGE_COLOR = '#cbd5e1';
const ARTICLE_EDGE_COLOR = '#cbd5e1';
const ARROW_COLOR = '#94a3b8';
const MAX_FIT_ZOOM = 1.15;

const CAPTION_ID = '__center-caption';

interface GraphCanvasProps {
    subgraph: Subgraph;
    // 선택했을 때 함께 강조할 노드. 없으면 선으로 이어진 이웃을 강조한다.
    relatedNodeIds: string[] | null;
    // 중심 노드 아래 작은 글씨로 붙는 분야 이름
    centerCaption: string;
    selectedNodeId: string | null;
    // 범례 필터로 숨길 노드와 선의 id
    hiddenIds: Set<string>;
    onSelectNode: (node: SubgraphNode) => void;
    onRecenter: (conceptId: string) => void;
    onClearSelection: () => void;
    // 메인 페이지 미리보기. 확대, 이동, 끌기를 막아 페이지 스크롤에 걸리지 않게 하고, 확대 버튼도 숨긴다.
    preview?: boolean;
}

const STYLESHEET: cytoscape.StylesheetJson = [
    {
        selector: 'node',
        style: {
            'font-family': FONT_FAMILY,
            'font-size': 14,
            color: '#1f2937',
            label: 'data(label)',
            'text-valign': 'center',
            'text-wrap': 'wrap',
            'text-max-width': '170px',
            'line-height': 1.35,
            'min-zoomed-font-size': 6,
            'overlay-opacity': 0,
            // 라벨 글씨를 눌러도 노드를 누른 것으로 본다.
            'text-events': 'yes',
        },
    },
    {
        // 개념은 분야 색으로 채운 원이다. 글(채운 네모)과는 모양으로 구분한다.
        selector: 'node[kind = "concept"]',
        style: { shape: 'ellipse', width: 14, height: 14, 'background-color': 'data(color)', 'border-width': 0 },
    },
    {
        // 글은 종이 한 장처럼 세로로 조금 긴, 색을 채운 카드다. 속이 빈 개념 원과 모양으로 구분된다.
        selector: 'node[kind = "article"]',
        style: { shape: 'round-rectangle', width: 12, height: 15, 'background-color': ARTICLE_COLOR, 'border-width': 0 },
    },
    { selector: 'node[?overview]', style: { 'font-size': 15, width: 11, height: 11, 'border-width': 0, 'text-max-width': '170px', 'text-wrap': 'ellipsis', 'text-rotation': (node: cytoscape.NodeSingular) => node.data('rotation') } },
    { selector: 'node[?overview][kind = "article"]', style: { width: 10, height: 13, 'border-width': 0 } },
    { selector: 'node[side < 0]', style: { 'text-halign': 'left', 'text-margin-x': -10 } },
    { selector: 'node[side > 0]', style: { 'text-halign': 'right', 'text-margin-x': 10 } },
    {
        // 가운데 노드는 블로그의 선택된 태그 버튼처럼 검은 알약 안에 이름을 넣는다.
        selector: 'node.center',
        style: {
            shape: 'round-rectangle',
            width: 'data(pillWidth)',
            height: 40,
            'background-color': '#111827',
            'border-width': 6,
            'border-color': '#e5e7eb',
            'text-valign': 'center',
            'text-halign': 'center',
            'text-margin-x': 0,
            'text-wrap': 'none',
            'font-size': 15,
            'font-weight': 700,
            color: '#ffffff',
        },
    },
    {
        // 전체 보기의 가운데는 노트북 앞 고양이를 넣은 원이다. 안쪽 진한 테두리와 바깥 연한 링을 겹쳐 태그 버튼과 톤을 맞춘다.
        selector: 'node[kind = "hub"]',
        style: {
            shape: 'ellipse',
            width: 92,
            height: 92,
            'background-color': '#ffffff',
            'background-image': HUB_IMAGE,
            // contain 이면 background-width 가 무시되므로 none 으로 두고 크기를 직접 정한다. 이미지는 정사각형이라 비율이 유지된다.
            'background-fit': 'none',
            'background-width': '60%',
            'background-height': '60%',
            'background-image-smoothing': 'yes',
            'border-width': 2,
            'border-color': '#111827',
            'outline-width': 6,
            'outline-color': '#e5e7eb',
            'outline-offset': 0,
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 14,
            'font-size': 15,
            'font-weight': 700,
            color: '#111827',
            'text-background-color': '#ffffff',
            'text-background-opacity': 0.92,
            'text-background-padding': '3px',
            'text-background-shape': 'roundrectangle',
        },
    },
    {
        selector: `#${CAPTION_ID}`,
        style: {
            shape: 'ellipse',
            width: 1,
            height: 1,
            'background-opacity': 0,
            'font-size': 12,
            color: '#6b7280',
            'text-valign': 'center',
            'text-halign': 'center',
            'text-background-color': '#ffffff',
            'text-background-opacity': 0.92,
            'text-background-padding': '2px',
            events: 'no',
            'text-events': 'no',
        },
    },
    {
        selector: 'edge',
        style: {
            width: 1.6,
            'line-color': CONCEPT_EDGE_COLOR,
            'target-arrow-color': ARROW_COLOR,
            'curve-style': 'unbundled-bezier',
            'control-point-distances': 'data(distances)',
            'control-point-weights': 'data(weights)',
            'arrow-scale': 0.6,
            'overlay-opacity': 0,
        },
    },
    { selector: 'edge[type = "PART_OF"]', style: { 'target-arrow-shape': 'triangle' } },
    {
        selector: 'edge[type = "AFFECTS"]',
        style: { 'target-arrow-shape': 'triangle', 'line-style': 'dashed', 'line-dash-pattern': [6, 4] },
    },
    { selector: 'edge[type = "MENTIONS"]', style: { 'line-color': ARTICLE_EDGE_COLOR } },
    // 모든 분야 고리 배치에서는 선을 바퀴살처럼 곧게 긋는다.
    { selector: 'edge[?ring]', style: { 'curve-style': 'straight' } },
    { selector: 'edge[type = "HUB"]', style: { 'line-color': 'data(color)', 'line-opacity': 0.6, width: 1.2 } },
    { selector: 'edge[?overview][type = "MENTIONS"]', style: { 'line-opacity': 0.8, width: 1.2 } },
    { selector: '.dimmed', style: { opacity: 0.15 } },
    { selector: 'node.selected', style: { 'border-width': 3, 'border-color': '#111827', 'font-weight': 700 } },
    { selector: 'node.center.selected', style: { 'border-width': 6, 'border-color': '#9ca3af' } },
    { selector: 'node[kind = "hub"].selected', style: { 'border-width': 2, 'border-color': '#111827', 'outline-color': '#9ca3af' } },
    { selector: 'edge.highlighted', style: { width: 2.2 } },
    { selector: 'node.label-hidden', style: { label: '' } },
    { selector: '.filtered', style: { display: 'none' } },
];

// 미리보기 카드는 약 0.5배로 그려지므로, 글자 크기를 두 배쯤 잡아야 화면에서 12px 안팎으로 읽힌다.
const PREVIEW_LABEL_CLASS = 'preview-label';
const PREVIEW_LABEL_STYLE: cytoscape.StylesheetJsonBlock = {
    selector: `node.${PREVIEW_LABEL_CLASS}`,
    style: {
        label: 'data(label)',
        'font-size': 24,
        'font-weight': 600,
        color: '#111827',
        'text-rotation': 'none',
        'text-wrap': 'ellipsis',
        'text-max-width': '360px',
        'text-background-color': '#ffffff',
        'text-background-opacity': 0.9,
        'text-background-padding': '3px',
        'text-background-shape': 'roundrectangle',
    },
};
// 미리보기 카드는 가장자리가 잘리므로, 제목을 노드 바깥이 아니라 그래프 안쪽(허브 쪽)에 붙인다.
const PREVIEW_LABEL_SIDE_STYLES: cytoscape.StylesheetJsonBlock[] = [
    { selector: `node.${PREVIEW_LABEL_CLASS}[side > 0]`, style: { 'text-halign': 'left', 'text-margin-x': -10 } },
    { selector: `node.${PREVIEW_LABEL_CLASS}[side < 0]`, style: { 'text-halign': 'right', 'text-margin-x': 10 } },
];

// Cytoscape 는 스타일 값을 해석한 결과를 크기 제한 없이 propCache 에 쌓는다. 노드가 움직이는 동안 곡선 제어점이
// 매 프레임 새 값이라, 그대로 두면 탐색할수록 메모리가 늘어난다(측정: 중심 변경 292번에 약 6MB). 다시 계산하면 그만인
// 메모라서 화면을 바꿀 때와 새로 끌기 시작할 때 비운다. 내부 필드라 없으면 아무것도 하지 않는다.
const clearStyleParseCache = (cy: cytoscape.Core): void => {
    const style = cy.style() as unknown as { propCache?: unknown[] };
    if (Array.isArray(style.propCache)) {
        style.propCache = [];
    }
};

// 화면을 그래프에 맞추되, 노드가 적을 때 지나치게 커지지 않게 한다.
// includeLabels 가 false 면 라벨을 빼고 노드만으로 맞춘다. 전체 보기의 회전된 긴 라벨 때문에 그래프가 작아지는 것을 막는다.
export const fitGraph = (cy: cytoscape.Core, includeLabels = true): void => {
    if (includeLabels) {
        cy.fit(undefined, FIT_PADDING);
    } else {
        const box = cy.elements().boundingBox({ includeLabels: false });
        const level = Math.min((cy.width() - FIT_PADDING * 2) / box.w, (cy.height() - FIT_PADDING * 2) / box.h);
        cy.zoom(level);
        cy.pan({ x: cy.width() / 2 - level * (box.x1 + box.w / 2), y: cy.height() / 2 - level * (box.y1 + box.h / 2) });
    }
    if (cy.zoom() > MAX_FIT_ZOOM) {
        cy.zoom(MAX_FIT_ZOOM);
        cy.center();
    }
};

const prefersReducedMotion = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const syncArticleLabels = (cy: cytoscape.Core): void => {
    cy.nodes('[kind = "article"]').toggleClass('label-hidden', cy.zoom() < LABEL_ZOOM_THRESHOLD);
};

// 알약 너비를 글자 수로 어림한다. 한글은 글자 크기만큼, 영문과 숫자는 그 0.6배로 본다.
const CENTER_FONT_SIZE = 15;
const PILL_PADDING = 36;
const estimatePillWidth = (label: string): number => {
    const textWidth = [...label].reduce((width, char) => width + (/[가-힣]/.test(char) ? CENTER_FONT_SIZE : CENTER_FONT_SIZE * 0.6), 0);
    return Math.round(textWidth + PILL_PADDING);
};

const toNodeDefinition = (node: SubgraphNode, position: PlacedPosition, centerId: string): cytoscape.ElementDefinition => ({
    group: 'nodes',
    data: {
        id: node.id,
        label: node.label,
        kind: node.kind,
        side: node.id === centerId ? 0 : position.side,
        pillWidth: estimatePillWidth(node.label),
        // 전체(모든 분야) 보기만 노드가 많아 촘촘한 스타일을 쓴다.
        overview: node.column !== undefined && centerId === ALL_HUB_ID,
        // 고리 배치에서는 라벨을 바퀴살 방향으로 돌린다. 왼쪽 절반은 뒤집어 글씨가 거꾸로 서지 않게 한다.
        rotation: node.column !== undefined && centerId === ALL_HUB_ID ? (position.side > 0 ? position.angle : position.angle + Math.PI) : 0,
        // 전체 보기와 중심 보기 모두 분야 색을 써서, 상세 패널의 칩 색과 맞춘다.
        color: categoryColor(node.category),
    },
    position: { x: position.x, y: position.y },
    classes: node.id === centerId ? 'center' : '',
});

export default function GraphCanvas({ subgraph, relatedNodeIds, centerCaption, selectedNodeId, hiddenIds, onSelectNode, onRecenter, onClearSelection, preview = false }: GraphCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const cyRef = useRef<cytoscape.Core | null>(null);
    const nodesRef = useRef(new Map<string, SubgraphNode>());
    const lastCenterRef = useRef<string | null>(null);
    // 레이아웃이 정한 각 노드의 제자리. 끌었다 놓으면 끈 노드와 이웃 모두 이 자리로 돌아간다.
    const homeRef = useRef(new Map<string, cytoscape.Position>());
    // 이벤트 핸들러는 한 번만 등록하고, 최신 콜백은 ref 로 읽는다.
    const handlersRef = useRef({ onSelectNode, onRecenter, onClearSelection });
    handlersRef.current = { onSelectNode, onRecenter, onClearSelection };

    // 인스턴스는 마운트할 때 한 번만 만든다.
    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return undefined;
        }
        performance.mark('knowledge:init-start');
        const cy = cytoscape({
            container,
            // 미리보기는 작은 카드라 라벨이 읽히지 않으므로 모두 숨기고 점과 선만 보여준다.
            // 분야를 강조할 때만 그 분야의 글 제목을 가로로, 화면에서 읽히는 크기로 보여준다.
            style: preview ? [...STYLESHEET, { selector: 'node', style: { label: '' } }, PREVIEW_LABEL_STYLE, ...PREVIEW_LABEL_SIDE_STYLES] : STYLESHEET,
            layout: { name: 'preset' },
            minZoom: MIN_ZOOM,
            maxZoom: MAX_ZOOM,
            boxSelectionEnabled: false,
            // preview 는 마운트할 때 정해지고 바뀌지 않으므로 생성 옵션으로만 쓴다.
            autoungrabify: preview,
            userZoomingEnabled: !preview,
            userPanningEnabled: !preview,
            selectionType: 'single',
        });
        cyRef.current = cy;
        performance.measure('knowledge:init', 'knowledge:init-start');

        let lastTap = { id: '', time: 0 };
        cy.on('tap', 'node', (event) => {
            const id: string = event.target.id();
            const node = nodesRef.current.get(id);
            if (!node) {
                return;
            }
            const now = Date.now();
            const isDoubleTap = lastTap.id === id && now - lastTap.time < DOUBLE_TAP_MS;
            lastTap = { id, time: now };
            if (isDoubleTap && node.kind === 'concept') {
                handlersRef.current.onRecenter(node.refId);
                return;
            }
            handlersRef.current.onSelectNode(node);
        });
        // 노드가 움직이면(끌기, 애니메이션 모두) 이어진 선의 곡선을 새 위치에 맞춰 다시 계산한다.
        cy.on('position', 'node', (event) => {
            event.target.connectedEdges().forEach((edge: cytoscape.EdgeSingular) => {
                edge.data(edgeCurve(edge.source().position(), edge.target().position()));
            });
        });

        // 노드를 끌면 이웃이 고무줄처럼 따라오고, 놓으면 끈 노드와 이웃이 함께 탄성 있게 제자리로 돌아간다.
        let drag: { last: cytoscape.Position; hasMoved: boolean; followers: { node: cytoscape.NodeSingular; weight: number }[] } | null = null;
        cy.on('grab', 'node', (event) => {
            clearStyleParseCache(cy);
            const node: cytoscape.NodeSingular = event.target;
            const first = node.neighborhood().nodes().filter((item) => item.id() !== CAPTION_ID);
            const firstIds = new Set(first.map((item) => item.id()));
            const second = first
                .neighborhood()
                .nodes()
                .filter((item) => !firstIds.has(item.id()) && item.id() !== node.id() && item.id() !== CAPTION_ID);
            const asNodes = (collection: cytoscape.CollectionReturnValue): cytoscape.NodeSingular[] =>
                collection.toArray().filter((item): item is cytoscape.NodeSingular => item.isNode());
            const followers = [
                ...asNodes(first).map((item) => ({ node: item, weight: FIRST_FOLLOW })),
                ...asNodes(second).map((item) => ({ node: item, weight: SECOND_FOLLOW })),
            ];
            followers.forEach(({ node: follower }) => follower.stop(true));
            drag = { last: { ...node.position() }, hasMoved: false, followers };
            container.classList.add('cursor-grabbing');
        });
        cy.on('drag', 'node', (event) => {
            if (!drag) {
                return;
            }
            const current = event.target.position();
            const dx = current.x - drag.last.x;
            const dy = current.y - drag.last.y;
            drag.last = { ...current };
            drag.hasMoved = true;
            const { followers } = drag;
            cy.batch(() => {
                followers.forEach(({ node, weight }) => {
                    const position = node.position();
                    node.position({ x: position.x + dx * weight, y: position.y + dy * weight });
                });
            });
        });
        cy.on('free', 'node', (event) => {
            container.classList.remove('cursor-grabbing');
            // 누르기만 하고 끌지 않았으면(클릭) 아무것도 움직이지 않는다.
            if (!drag?.hasMoved) {
                drag = null;
                return;
            }
            const dragged: cytoscape.NodeSingular = event.target;
            [dragged, ...drag.followers.map(({ node }) => node)].forEach((node) => {
                const home = homeRef.current.get(node.id());
                if (!home) {
                    return;
                }
                if (prefersReducedMotion()) {
                    node.position(home);
                } else {
                    node.animate({ position: home }, { duration: RETURN_DURATION_MS, easing: 'ease-out-quint' });
                }
            });
            drag = null;
        });
        cy.on('mouseover', 'node', () => container.classList.add('cursor-pointer'));
        cy.on('mouseout', 'node', () => container.classList.remove('cursor-pointer'));

        cy.on('tap', (event) => {
            if (event.target === cy) {
                handlersRef.current.onClearSelection();
            }
        });

        // 확대 배율이 기준선을 넘나들 때만 스타일을 바꾼다.
        let isLabelHidden = false;
        cy.on('zoom', () => {
            const shouldHide = cy.zoom() < LABEL_ZOOM_THRESHOLD;
            if (shouldHide !== isLabelHidden) {
                isLabelHidden = shouldHide;
                syncArticleLabels(cy);
            }
        });

        let frame = 0;
        const observer = new ResizeObserver(() => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => cy.resize());
        });
        observer.observe(container);

        return () => {
            observer.disconnect();
            cancelAnimationFrame(frame);
            cy.destroy();
            cyRef.current = null;
            lastCenterRef.current = null;
        };
    }, []);

    // 그래프 구성이 바뀌면 바뀐 요소만 넣고 뺀다. 중심이 바뀔 때만 화면을 다시 맞춘다.
    useEffect(() => {
        const cy = cyRef.current;
        if (!cy) {
            return;
        }
        performance.mark('knowledge:sync-start');
        clearStyleParseCache(cy);
        const positions = layoutSubgraph(subgraph);
        nodesRef.current = new Map(subgraph.nodes.map((node) => [node.id, node]));
        const nextIds = new Set([...(centerCaption ? [CAPTION_ID] : []), ...subgraph.nodes.map((node) => node.id), ...subgraph.edges.map((edge) => edge.id)]);
        // 중심 이름 아래 한 줄 더 내려 분야 이름을 둔다. 클릭되지 않는 라벨 전용 노드다.
        const captionY = 20 + 6 + 16;

        const isNewCenter = lastCenterRef.current !== subgraph.centerId;
        const added: { node: cytoscape.NodeSingular; from: cytoscape.Position }[] = [];
        positions.forEach((position, id) => homeRef.current.set(id, { x: position.x, y: position.y }));

        // 이전 화면에서 진행 중이던 애니메이션이 새 좌표를 덮어쓰지 않도록 먼저 멈춘다.
        cy.nodes().stop(true);

        cy.batch(() => {
            cy.elements().filter((element) => !nextIds.has(element.id())).remove();
            subgraph.nodes.forEach((node) => {
                const position = positions.get(node.id);
                if (!position) {
                    return;
                }
                const existing = cy.getElementById(node.id);
                const definition = toNodeDefinition(node, position, subgraph.centerId);
                if (existing.nonempty()) {
                    existing.data(definition.data);
                    existing.position(definition.position ?? position);
                    existing.classes(definition.classes ?? '');
                } else {
                    // 새 화면이면 가운데에서, 펼친 노드면 부모 자리에서 퍼져 나온다.
                    const from = isNewCenter ? { x: 0, y: 0 } : homeRef.current.get(node.parentId ?? '') ?? { x: 0, y: 0 };
                    added.push({ node: cy.add(definition), from });
                }
            });
            subgraph.edges.forEach((edge) => {
                const source = positions.get(edge.source);
                const target = positions.get(edge.target);
                if (!source || !target) {
                    return;
                }
                const curve = edgeCurve(source, target);
                const isOverview = subgraph.mode === 'overview';
                const targetCategory = nodesRef.current.get(edge.target)?.category ?? '';
                const color = CATEGORY_COLORS[targetCategory] ?? CONCEPT_EDGE_COLOR;
                const ring = subgraph.centerId === ALL_HUB_ID;
                const data = { id: edge.id, source: edge.source, target: edge.target, type: edge.type, overview: isOverview, ring, color, ...curve };
                const existing = cy.getElementById(edge.id);
                if (existing.nonempty()) {
                    existing.data(data);
                } else {
                    cy.add({ group: 'edges', data });
                }
            });
            const caption = cy.getElementById(CAPTION_ID);
            if (!centerCaption) {
                caption.remove();
            } else if (caption.nonempty()) {
                caption.data('label', centerCaption);
            } else {
                cy.add({ group: 'nodes', data: { id: CAPTION_ID, label: centerCaption }, position: { x: 0, y: captionY } });
            }
        });

        if (isNewCenter) {
            lastCenterRef.current = subgraph.centerId;
            // 미리보기는 사용자가 확대할 수 없으므로, 처음부터 노드가 크게 보이도록 라벨을 빼고 맞춘다.
            fitGraph(cy, !preview);
        }
        if (!prefersReducedMotion()) {
            added
                .filter(({ node }) => node.id() !== subgraph.centerId)
                .forEach(({ node, from }) => {
                    const target = { ...node.position() };
                    node.position(from);
                    node.animate({ position: target }, { duration: ENTER_DURATION_MS, easing: 'ease-out-cubic' });
                });
        }
        syncArticleLabels(cy);
        // 노드와 선 수를 이름에 붙여, 측정값과 실제 렌더링 규모를 함께 본다.
        performance.measure(`knowledge:sync nodes=${cy.nodes().length} edges=${cy.edges().length}`, 'knowledge:sync-start');
    }, [subgraph, centerCaption]);

    // 선택은 class 만 바꾼다. 레이아웃과 화면 위치는 그대로 둔다.
    useEffect(() => {
        const cy = cyRef.current;
        if (!cy) {
            return;
        }
        performance.mark('knowledge:select-start');
        cy.batch(() => {
            cy.elements().removeClass(`dimmed selected highlighted ${PREVIEW_LABEL_CLASS}`);
            if (!selectedNodeId) {
                return;
            }
            const selected = cy.getElementById(selectedNodeId);
            if (selected.empty()) {
                return;
            }
            selected.addClass('selected');
            if (relatedNodeIds) {
                const related = new Set([selectedNodeId, ...relatedNodeIds]);
                const keptNodes = cy.nodes().filter((node) => related.has(node.id()));
                const keptEdges = cy.edges().filter((edge) => related.has(edge.source().id()) && related.has(edge.target().id()));
                cy.elements().not(keptNodes).not(keptEdges).not(`#${CAPTION_ID}`).addClass('dimmed');
                keptEdges.addClass('highlighted');
                if (preview) {
                    keptNodes.filter('[kind = "article"]').addClass(PREVIEW_LABEL_CLASS);
                }
                return;
            }
            const neighborhood = selected.closedNeighborhood();
            cy.elements().not(neighborhood).not(`#${CAPTION_ID}`).addClass('dimmed');
            selected.connectedEdges().addClass('highlighted');
        });
        performance.measure('knowledge:select', 'knowledge:select-start');
    }, [selectedNodeId, relatedNodeIds, subgraph]);

    // 필터는 요소를 빼지 않고 숨기기만 한다. 좌표가 그대로라 필터를 껐다 켜도 그래프가 흔들리지 않는다.
    useEffect(() => {
        const cy = cyRef.current;
        if (!cy) {
            return;
        }
        cy.batch(() => {
            cy.elements().removeClass('filtered');
            cy.elements().filter((element) => hiddenIds.has(element.id())).addClass('filtered');
        });
    }, [hiddenIds, subgraph]);

    const zoomBy = (factor: number): void => {
        const cy = cyRef.current;
        if (!cy) {
            return;
        }
        const level = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, cy.zoom() * factor));
        cy.zoom({ level, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } });
    };

    const controlClass = 'flex h-8 w-8 items-center justify-center text-gray-700 hover:text-black';

    return (
        <>
            <div ref={containerRef} className="absolute inset-0" />
            {!preview && (
            <div className="absolute bottom-3 right-3 flex items-center gap-0.5">
                <button type="button" aria-label="축소" className={controlClass} onClick={() => zoomBy(1 / ZOOM_STEP)}>
                    <Minus className="h-5 w-5" />
                </button>
                <button type="button" aria-label="확대" className={controlClass} onClick={() => zoomBy(ZOOM_STEP)}>
                    <Plus className="h-5 w-5" />
                </button>
                <button
                    type="button"
                    aria-label="화면에 맞추기"
                    className={controlClass}
                    onClick={() => cyRef.current && fitGraph(cyRef.current)}
                >
                    <Scan className="h-5 w-5" />
                </button>
            </div>
            )}
        </>
    );
}
