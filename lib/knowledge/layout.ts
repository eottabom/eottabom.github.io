import type { OverviewColumn, Subgraph, SubgraphNode } from './subgraph';

// 부분 그래프의 좌표를 계산한다. 같은 입력이면 항상 같은 좌표가 나오고, 물리 시뮬레이션을 쓰지 않는다.
// 중심을 원점에 두고 왼쪽에는 개념, 오른쪽에는 글을 부채꼴(원호)로 세운다.

// 같은 열 노드 사이 최소 간격. 노드가 적을수록 넓게 벌려 캔버스를 채운다.
export const ROW_GAP = 44;
const ROW_GAP_BY_COUNT = [
    { maxCount: 6, gap: 76 },
    { maxCount: 10, gap: 60 },
];
// 글은 노드 수가 적어도 세로로 넓게 퍼지게 한다.
const ARTICLE_GAP_BY_COUNT = [
    { maxCount: 3, gap: 150 },
    { maxCount: 6, gap: 96 },
    { maxCount: 10, gap: 64 },
];
// 레퍼런스처럼 100% 배율에서 캔버스에 들어가는 크기로 잡는다.
const NEIGHBOR_RADIUS = 220;
const ARTICLE_RADIUS = 200;
const EXPANDED_RING_GAP = 210;

// 전체 보기의 열. 허브를 감싸는 원호로 세우고, 바깥 열일수록 조금 더 비틀어 나선처럼 보이게 한다.
const OVERVIEW_GAP = 28;
const OVERVIEW_MAX_SPAN = 1.7;
const OVERVIEW_RING_GAP = 250;
const OVERVIEW_COLUMNS = {
    'inner-left': { side: -1, radius: 300, twist: -0.08 },
    'inner-right': { side: 1, radius: 300, twist: 0.08 },
    'outer-left': { side: -1, radius: 0, twist: -0.2 },
    'outer-right': { side: 1, radius: 0, twist: 0.2 },
} as const;

// 원호가 위아래로 펼쳐지는 최대 각도(라디안). 넘치면 반지름을 키운다.
const MAX_ARC_SPAN = 2.2;

export type Side = -1 | 0 | 1;

export interface PlacedPosition {
    x: number;
    y: number;
    side: Side;
    angle: number;
}

const gapFor = (count: number, table: { maxCount: number; gap: number }[]): number => {
    return table.find(({ maxCount }) => count <= maxCount)?.gap ?? ROW_GAP;
};

const radiusFor = (count: number, minRadius: number, gap: number): number => {
    return Math.max(minRadius, ((count - 1) * gap) / MAX_ARC_SPAN);
};

const placeOnArc = (radius: number, angle: number, side: Side): PlacedPosition => ({
    x: side * radius * Math.cos(angle),
    y: radius * Math.sin(angle),
    side,
    angle,
});

// 가운데를 기준으로 위아래 같은 간격으로 각도를 나눈다.
const spreadAngles = (count: number, radius: number, gap: number): number[] => {
    const step = gap / radius;
    return Array.from({ length: count }, (_, position) => (position - (count - 1) / 2) * step);
};

// 원하는 각도 순서대로 놓되, 이웃한 노드 사이 간격이 최소 간격보다 좁으면 아래로 민다. 넘친 만큼 전체를 다시 위로 올린다.
const resolveAngles = (desired: number[], radius: number): number[] => {
    const minStep = ROW_GAP / radius;
    const resolved: number[] = [];
    desired.forEach((angle, position) => {
        resolved.push(position === 0 ? angle : Math.max(angle, resolved[position - 1] + minStep));
    });
    if (resolved.length === 0) {
        return resolved;
    }
    const overflow = (resolved[0] + resolved[resolved.length - 1]) / 2 - (desired[0] + desired[desired.length - 1]) / 2;
    return resolved.map((angle) => angle - overflow);
};

const byOrderThenLabel = (a: SubgraphNode, b: SubgraphNode): number => {
    return a.order - b.order || a.label.localeCompare(b.label, 'ko');
};

// 모든 분야 보기. 개념은 허브를 360도 두르는 고리에 분야 순서대로 잇고, 글은 바깥 고리에서 자기 개념들 방향에 놓는다.
const RING_GAP = 26;
const RING_MIN_RADIUS = 260;
const ARTICLE_RING_OFFSET = 230;
const START_ANGLE = -Math.PI / 2;

const placeOnCircle = (radius: number, angle: number): PlacedPosition => {
    const x = radius * Math.cos(angle);
    return { x, y: radius * Math.sin(angle), side: x >= 0 ? 1 : -1, angle };
};

// 원하는 각도 순서대로 놓되 이웃과 최소 간격을 지키고, 한 바퀴를 넘지 않게 맞춘다.
const resolveCircularAngles = (desired: number[], minStep: number): number[] => {
    const resolved: number[] = [];
    desired.forEach((angle, position) => {
        resolved.push(position === 0 ? angle : Math.max(angle, resolved[position - 1] + minStep));
    });
    const span = resolved.length > 0 ? resolved[resolved.length - 1] - resolved[0] : 0;
    const limit = 2 * Math.PI - minStep;
    if (span > limit) {
        const scale = limit / span;
        return resolved.map((angle) => resolved[0] + (angle - resolved[0]) * scale);
    }
    return resolved;
};

const layoutRings = (subgraph: Subgraph): Map<string, PlacedPosition> => {
    const positions = new Map<string, PlacedPosition>();
    positions.set(subgraph.centerId, { x: 0, y: 0, side: 0, angle: 0 });
    const byColumnOrder = (column: OverviewColumn): SubgraphNode[] =>
        subgraph.nodes.filter((node) => node.column === column).sort((a, b) => a.order - b.order);
    const concepts = [...byColumnOrder('inner-left'), ...byColumnOrder('inner-right')];
    const conceptRadius = Math.max(RING_MIN_RADIUS, (concepts.length * RING_GAP) / (2 * Math.PI));
    const conceptStep = (2 * Math.PI) / Math.max(concepts.length, 1);
    concepts.forEach((node, position) => {
        positions.set(node.id, placeOnCircle(conceptRadius, START_ANGLE + position * conceptStep));
    });

    const articleRadius = conceptRadius + ARTICLE_RING_OFFSET;
    const linkedAngles = new Map<string, number[]>();
    subgraph.edges
        .filter((edge) => edge.type === 'MENTIONS')
        .forEach((edge) => {
            const angle = positions.get(edge.source)?.angle;
            if (angle !== undefined) {
                linkedAngles.set(edge.target, [...(linkedAngles.get(edge.target) ?? []), angle]);
            }
        });
    // 이어진 개념들 방향의 평균(원형 평균)을 글의 원하는 각도로 쓴다.
    const articles = [...byColumnOrder('outer-left'), ...byColumnOrder('outer-right')]
        .map((node) => {
            const angles = linkedAngles.get(node.id) ?? [START_ANGLE];
            const sin = angles.reduce((sum, angle) => sum + Math.sin(angle), 0);
            const cos = angles.reduce((sum, angle) => sum + Math.cos(angle), 0);
            let desired = Math.atan2(sin, cos);
            while (desired < START_ANGLE) {
                desired += 2 * Math.PI;
            }
            return { node, desired };
        })
        .sort((a, b) => a.desired - b.desired || a.node.label.localeCompare(b.node.label, 'ko'));
    const articleAngles = resolveCircularAngles(articles.map(({ desired }) => desired), RING_GAP / articleRadius);
    articles.forEach(({ node }, position) => {
        positions.set(node.id, placeOnCircle(articleRadius, articleAngles[position]));
    });
    return positions;
};

const layoutOverview = (subgraph: Subgraph): Map<string, PlacedPosition> => {
    const positions = new Map<string, PlacedPosition>();
    positions.set(subgraph.centerId, { x: 0, y: 0, side: 0, angle: 0 });
    const membersOf = (column: OverviewColumn): SubgraphNode[] =>
        subgraph.nodes.filter((node) => node.column === column).sort((a, b) => a.order - b.order);
    // 분야 하나만 볼 때는 개념(왼쪽 안쪽)과 글(오른쪽 바깥)만 있으므로 글을 안쪽 거리로 당기고 넓게 벌린다.
    const isSingleCategory = membersOf('outer-left').length === 0 && membersOf('inner-right').length === 0;
    if (!isSingleCategory) {
        return layoutRings(subgraph);
    }
    const innerRadius = { left: 0, right: 0 };

    (['inner-left', 'inner-right', 'outer-left', 'outer-right'] as const).forEach((column) => {
        const members = membersOf(column);
        if (members.length === 0) {
            return;
        }
        const { side, twist } = OVERVIEW_COLUMNS[column];
        const sideKey = side < 0 ? 'left' : 'right';
        const isOuter = column.startsWith('outer');
        const gap = isSingleCategory
            ? gapFor(members.length, isOuter ? ARTICLE_GAP_BY_COUNT : ROW_GAP_BY_COUNT)
            : OVERVIEW_GAP;
        const minRadius = isOuter && !isSingleCategory ? innerRadius[sideKey] + OVERVIEW_RING_GAP : OVERVIEW_COLUMNS['inner-left'].radius;
        const radius = Math.max(minRadius, ((members.length - 1) * gap) / OVERVIEW_MAX_SPAN);
        if (!isOuter) {
            innerRadius[sideKey] = radius;
        }
        spreadAngles(members.length, radius, gap).forEach((angle, position) => {
            const twisted = angle + (isSingleCategory ? 0 : twist);
            positions.set(members[position].id, placeOnArc(radius, twisted, side));
        });
    });
    return positions;
};

export const layoutSubgraph = (subgraph: Subgraph): Map<string, PlacedPosition> => {
    if (subgraph.mode === 'overview') {
        return layoutOverview(subgraph);
    }
    const positions = new Map<string, PlacedPosition>();
    positions.set(subgraph.centerId, { x: 0, y: 0, side: 0, angle: 0 });

    const neighbors = subgraph.nodes.filter((node) => node.role === 'neighbor').sort(byOrderThenLabel);
    const neighborGap = gapFor(neighbors.length, ROW_GAP_BY_COUNT);
    const neighborRadius = radiusFor(neighbors.length, NEIGHBOR_RADIUS, neighborGap);
    spreadAngles(neighbors.length, neighborRadius, neighborGap).forEach((angle, position) => {
        positions.set(neighbors[position].id, placeOnArc(neighborRadius, angle, -1));
    });

    // 글은 order(작성일 내림차순) 그대로 둔다.
    const articles = subgraph.nodes.filter((node) => node.role === 'article').sort((a, b) => a.order - b.order);
    const articleGap = gapFor(articles.length, ARTICLE_GAP_BY_COUNT);
    const articleRadius = radiusFor(articles.length, ARTICLE_RADIUS, articleGap);
    spreadAngles(articles.length, articleRadius, articleGap).forEach((angle, position) => {
        positions.set(articles[position].id, placeOnArc(articleRadius, angle, 1));
    });

    // 펼친 개념의 이웃은 부모 노드의 각도 근처에 모아, 선이 덜 엇갈리게 한다.
    const expanded = subgraph.nodes
        .filter((node) => node.role === 'expanded')
        .map((node) => ({ node, parentAngle: positions.get(node.parentId ?? '')?.angle ?? 0 }))
        .sort((a, b) => a.parentAngle - b.parentAngle || a.node.label.localeCompare(b.node.label, 'ko'));
    const expandedRadius = radiusFor(expanded.length, neighborRadius + EXPANDED_RING_GAP, ROW_GAP);
    const expandedAngles = resolveAngles(
        expanded.map(({ parentAngle }) => parentAngle),
        expandedRadius,
    );
    expanded.forEach(({ node }, position) => {
        positions.set(node.id, placeOnArc(expandedRadius, expandedAngles[position], -1));
    });

    return positions;
};

export interface EdgeCurve {
    distances: [number, number];
    weights: [number, number];
}

// 양 끝에서 수평으로 나가는 S 자 곡선을 Cytoscape unbundled-bezier 의 두 제어점으로 나타낸다.
// 제어점은 (중간 x, 출발 y), (중간 x, 도착 y) 이고, 이를 출발에서 도착으로 가는 직선 기준의 비율과 수직 거리로 바꾼다.
export const edgeCurve = (source: { x: number; y: number }, target: { x: number; y: number }): EdgeCurve => {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const lengthSquared = dx * dx + dy * dy;
    if (lengthSquared === 0) {
        return { distances: [0, 0], weights: [0.5, 0.5] };
    }
    const length = Math.sqrt(lengthSquared);
    const toLineCoordinates = (px: number, py: number): [number, number] => [
        (px * dx + py * dy) / lengthSquared,
        (dx * py - dy * px) / length,
    ];
    const [firstWeight, firstDistance] = toLineCoordinates(dx / 2, 0);
    const [secondWeight, secondDistance] = toLineCoordinates(dx / 2, dy);
    return { distances: [firstDistance, secondDistance], weights: [firstWeight, secondWeight] };
};
