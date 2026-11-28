import { RELATION_GROUPS, groupConceptRelations } from './query';
import type { KnowledgeIndex, RelationGroupKey } from './query';
import { articleNodeId, conceptNodeId } from './types';
import type { RelationType } from './types';

// 중심 개념 기준으로 화면에 그릴 노드와 선만 고른다. 전체 데이터를 그래프 라이브러리에 넣지 않기 위한 단계다.

// 한 열에 보여줄 최대 노드 수. 측정 결과에 따라 조정한다.
export const MAX_PER_COLUMN = 12;
// 여러 개념을 펼쳐도 그래프가 무한히 커지지 않도록 전체 노드 수를 제한한다.
export const MAX_NODES = 60;

export type NodeRole = 'center' | 'neighbor' | 'expanded' | 'article';
export type EdgeType = RelationType | 'MENTIONS' | 'HUB';
// 전체 보기에서 노드가 놓이는 열. 안쪽은 개념, 바깥쪽은 글이다.
export type OverviewColumn = 'inner-left' | 'inner-right' | 'outer-left' | 'outer-right';

export const ALL_HUB_ID = 'hub:all';

export interface SubgraphNode {
    id: string;
    kind: 'concept' | 'article' | 'hub';
    column?: OverviewColumn;
    refId: string;
    label: string;
    category: string | null;
    role: NodeRole;
    // expanded 노드를 펼친 개념의 노드 id
    parentId: string | null;
    // 관계 그룹 순서. 같은 열 안에서 정렬할 때 쓴다.
    order: number;
}

export interface SubgraphEdge {
    id: string;
    source: string;
    target: string;
    type: EdgeType;
}

export interface Subgraph {
    // overview: 허브를 가운데 두고 전체 개념과 글을 보여준다. focus: 한 개념 중심으로 이웃만 보여준다.
    mode: 'overview' | 'focus';
    centerId: string;
    nodes: SubgraphNode[];
    edges: SubgraphEdge[];
    // 열 제한 때문에 그리지 않은 노드 수
    hiddenCount: number;
    // 전체 노드 제한 때문에 펼치지 못한 개념
    skippedExpansions: string[];
}

export interface SubgraphOptions {
    expanded: string[];
    categoryFilter: string | null;
}

const GROUP_ORDER: Record<RelationGroupKey, number> = Object.fromEntries(
    RELATION_GROUPS.map(({ key }, position) => [key, position]),
) as Record<RelationGroupKey, number>;

const shortTitle = (title: string): string => title.split(' - ')[0];

const edgeId = (source: string, target: string, type: EdgeType): string => `${type}:${source}->${target}`;

export const buildSubgraph = (index: KnowledgeIndex, centerConceptId: string, options: SubgraphOptions): Subgraph | null => {
    const center = index.conceptsById.get(centerConceptId);
    if (!center) {
        return null;
    }
    const nodes = new Map<string, SubgraphNode>();
    const edges = new Map<string, SubgraphEdge>();
    let hiddenCount = 0;
    const skippedExpansions: string[] = [];

    const isVisibleCategory = (category: string): boolean => {
        return options.categoryFilter === null || category === options.categoryFilter;
    };

    const addConcept = (conceptId: string, role: NodeRole, parentId: string | null, order: number): string => {
        const id = conceptNodeId(conceptId);
        const concept = index.conceptsById.get(conceptId);
        if (!nodes.has(id) && concept) {
            nodes.set(id, { id, kind: 'concept', refId: conceptId, label: concept.name, category: concept.category, role, parentId, order });
        }
        return id;
    };

    const addRelationEdge = (source: string, target: string, type: RelationType): void => {
        const id = edgeId(conceptNodeId(source), conceptNodeId(target), type);
        edges.set(id, { id, source: conceptNodeId(source), target: conceptNodeId(target), type });
    };

    const centerId = addConcept(center.id, 'center', null, 0);

    // 왼쪽 열: 중심과 직접 이어진 개념
    const groups = groupConceptRelations(center.id, index.relationsByConcept.get(center.id) ?? []);
    const neighbors = RELATION_GROUPS.flatMap(({ key }) =>
        groups[key]
            .filter(({ conceptId }) => isVisibleCategory(index.conceptsById.get(conceptId)?.category ?? ''))
            .map((entry) => ({ ...entry, order: GROUP_ORDER[key] })),
    );
    const seenNeighbors = new Set<string>();
    const uniqueNeighbors = neighbors.filter(({ conceptId }) => {
        if (seenNeighbors.has(conceptId)) {
            return false;
        }
        seenNeighbors.add(conceptId);
        return true;
    });
    hiddenCount += Math.max(uniqueNeighbors.length - MAX_PER_COLUMN, 0);
    const visibleNeighborIds = new Set(uniqueNeighbors.slice(0, MAX_PER_COLUMN).map(({ conceptId }) => conceptId));
    uniqueNeighbors
        .filter(({ conceptId }) => visibleNeighborIds.has(conceptId))
        .forEach(({ conceptId, order }) => addConcept(conceptId, 'neighbor', null, order));
    neighbors
        .filter(({ conceptId }) => visibleNeighborIds.has(conceptId))
        .forEach(({ relation }) => addRelationEdge(relation.source, relation.target, relation.type));

    // 오른쪽 열: 중심 개념을 다룬 글
    const articles = index.articlesByConcept.get(center.id) ?? [];
    hiddenCount += Math.max(articles.length - MAX_PER_COLUMN, 0);
    articles.slice(0, MAX_PER_COLUMN).forEach((article, position) => {
        const id = articleNodeId(article.id);
        nodes.set(id, { id, kind: 'article', refId: article.id, label: shortTitle(article.title), category: null, role: 'article', parentId: null, order: position });
        const mention = edgeId(centerId, id, 'MENTIONS');
        edges.set(mention, { id: mention, source: centerId, target: id, type: 'MENTIONS' });
    });

    // 왼쪽 바깥 열: 사용자가 펼친 개념의 이웃
    options.expanded
        .filter((conceptId) => visibleNeighborIds.has(conceptId))
        .forEach((conceptId) => {
            const parentNodeId = conceptNodeId(conceptId);
            const candidates = (index.relationsByConcept.get(conceptId) ?? []).filter((relation) => {
                const other = relation.source === conceptId ? relation.target : relation.source;
                return other !== center.id && isVisibleCategory(index.conceptsById.get(other)?.category ?? '');
            });
            const newConceptIds = [
                ...new Set(
                    candidates
                        .map((relation) => (relation.source === conceptId ? relation.target : relation.source))
                        .filter((other) => !nodes.has(conceptNodeId(other))),
                ),
            ];
            if (nodes.size + newConceptIds.length > MAX_NODES) {
                skippedExpansions.push(conceptId);
                return;
            }
            newConceptIds.forEach((other) => addConcept(other, 'expanded', parentNodeId, 0));
            candidates.forEach((relation) => addRelationEdge(relation.source, relation.target, relation.type));
        });

    return { mode: 'focus', centerId, nodes: [...nodes.values()], edges: [...edges.values()], hiddenCount, skippedExpansions };
};

// 분야를 앞에서부터 왼쪽에 채우다가, 왼쪽 개념 수가 절반을 넘으면 나머지를 오른쪽에 둔다.
const splitCategories = (categoryIds: string[], countOf: (categoryId: string) => number): Set<string> => {
    const total = categoryIds.reduce((sum, id) => sum + countOf(id), 0);
    const left = new Set<string>();
    let leftCount = 0;
    for (const categoryId of categoryIds) {
        if (leftCount >= total / 2) {
            break;
        }
        left.add(categoryId);
        leftCount += countOf(categoryId);
    }
    return left;
};

// 전체 보기. 허브(전체 또는 한 분야)를 가운데 두고, 해당 개념과 그 개념을 다룬 글을 모두 넣는다.
export const buildOverview = (index: KnowledgeIndex, categoryFilter: string | null): Subgraph => {
    const categoryIds = [...index.categoryNames.keys()].filter((id) => categoryFilter === null || id === categoryFilter);
    const concepts = categoryIds.flatMap((categoryId) =>
        [...index.conceptsById.values()].filter((concept) => concept.category === categoryId),
    );
    const leftCategories = categoryFilter === null
        ? splitCategories(categoryIds, (id) => concepts.filter((concept) => concept.category === id).length)
        : new Set(categoryIds);

    const hubId = categoryFilter === null ? ALL_HUB_ID : `hub:${categoryFilter}`;
    const hubLabel = categoryFilter === null ? 'All' : index.categoryNames.get(categoryFilter) ?? categoryFilter;
    const nodes: SubgraphNode[] = [
        { id: hubId, kind: 'hub', refId: categoryFilter ?? 'all', label: hubLabel, category: categoryFilter, role: 'center', parentId: null, order: 0 },
    ];
    const edges: SubgraphEdge[] = [];
    const columnOfConcept = new Map<string, OverviewColumn>();
    const orderInColumn = new Map<string, number>();

    (['inner-left', 'inner-right'] as const).forEach((column) => {
        concepts
            .filter((concept) => leftCategories.has(concept.category) === (column === 'inner-left'))
            .forEach((concept, position) => {
                const id = conceptNodeId(concept.id);
                columnOfConcept.set(concept.id, column);
                orderInColumn.set(concept.id, position);
                nodes.push({ id, kind: 'concept', column, refId: concept.id, label: concept.name, category: concept.category, role: 'neighbor', parentId: null, order: position });
                edges.push({ id: edgeId(hubId, id, 'HUB'), source: hubId, target: id, type: 'HUB' });
            });
    });

    const visibleConceptIds = new Set(concepts.map((concept) => concept.id));
    const placedArticles = [...index.articlesById.values()]
        .map((article) => ({ article, linked: article.concepts.filter((id) => visibleConceptIds.has(id)) }))
        .filter(({ linked }) => linked.length > 0)
        .map(({ article, linked }) => {
            const leftCount = linked.filter((id) => columnOfConcept.get(id) === 'inner-left').length;
            const column: OverviewColumn = categoryFilter !== null || leftCount * 2 < linked.length ? 'outer-right' : 'outer-left';
            // 이어진 개념들의 평균 위치에 맞춰 정렬해 선이 덜 엇갈리게 한다.
            const barycenter = linked.reduce((sum, id) => sum + (orderInColumn.get(id) ?? 0), 0) / linked.length;
            return { article, linked, column, barycenter };
        });

    (['outer-left', 'outer-right'] as const).forEach((column) => {
        placedArticles
            .filter((entry) => entry.column === column)
            .sort((a, b) => a.barycenter - b.barycenter || a.article.title.localeCompare(b.article.title, 'ko'))
            .forEach(({ article, linked }, position) => {
                const id = articleNodeId(article.id);
                nodes.push({ id, kind: 'article', column, refId: article.id, label: shortTitle(article.title), category: null, role: 'article', parentId: null, order: position });
                // 분야 하나만 볼 때는 개념(왼쪽)과 글(오른쪽)이 허브 양쪽에 있어서, 개념에서 글로 선을 그으면 허브를 가로지른다.
                // 그래서 허브에서 글로만 잇고, 개념과 글의 연결은 선택했을 때 강조로 보여준다.
                if (categoryFilter !== null) {
                    edges.push({ id: edgeId(hubId, id, 'MENTIONS'), source: hubId, target: id, type: 'MENTIONS' });
                    return;
                }
                linked.forEach((conceptId) => {
                    const conceptNode = conceptNodeId(conceptId);
                    edges.push({ id: edgeId(conceptNode, id, 'MENTIONS'), source: conceptNode, target: id, type: 'MENTIONS' });
                });
            });
    });

    return { mode: 'overview', centerId: hubId, nodes, edges, hiddenCount: 0, skippedExpansions: [] };
};

export interface GraphFilter {
    // 숨길 노드 종류. 허브와 중심 개념은 숨기지 않는다.
    hiddenKinds: ReadonlyArray<'concept' | 'article'>;
    hiddenRelationTypes: ReadonlyArray<RelationType>;
}

// 필터로 숨길 노드와 선의 id. 그래프에서 빼지 않고 숨기기만 해서, 필터를 바꿔도 다른 노드의 좌표가 그대로다.
export const hiddenElementIds = (subgraph: Subgraph, filter: GraphFilter): Set<string> => {
    const hidden = new Set<string>();
    const isFixed = (node: SubgraphNode): boolean => node.id === subgraph.centerId || node.kind === 'hub';
    subgraph.nodes
        .filter((node) => !isFixed(node) && node.kind !== 'hub' && filter.hiddenKinds.includes(node.kind as 'concept' | 'article'))
        .forEach((node) => hidden.add(node.id));
    const hiddenTypes = new Set<EdgeType>(filter.hiddenRelationTypes);
    const isEdgeHidden = (edge: SubgraphEdge): boolean =>
        hiddenTypes.has(edge.type) || hidden.has(edge.source) || hidden.has(edge.target);

    // 중심 보기에서는 중심에서 보이는 선을 따라 닿지 않는 노드도 숨긴다. 펼친 노드처럼 다른 노드를 거쳐 이어진 경우도 함께 처리된다.
    if (subgraph.mode === 'focus') {
        const reachable = new Set([subgraph.centerId]);
        const queue = [subgraph.centerId];
        while (queue.length > 0) {
            const current = queue.shift() as string;
            subgraph.edges
                .filter((edge) => !isEdgeHidden(edge) && (edge.source === current || edge.target === current))
                .forEach((edge) => {
                    const other = edge.source === current ? edge.target : edge.source;
                    if (!reachable.has(other)) {
                        reachable.add(other);
                        queue.push(other);
                    }
                });
        }
        subgraph.nodes.filter((node) => !reachable.has(node.id)).forEach((node) => hidden.add(node.id));
    }
    subgraph.edges.filter(isEdgeHidden).forEach((edge) => hidden.add(edge.id));
    return hidden;
};
