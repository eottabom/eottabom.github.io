import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createKnowledgeIndex } from './query';
import { MAX_NODES, MAX_PER_COLUMN, buildOverview, buildSubgraph, hiddenElementIds } from './subgraph';
import { ROW_GAP, edgeCurve, layoutSubgraph } from './layout';
import type { Article, Concept, KnowledgeData, Relation } from './types';

const concept = (id: string, category = 'jvm'): Concept => ({ id, name: id, category, aliases: [], description: '' });
const relation = (source: string, target: string, type: Relation['type'] = 'RELATED_TO'): Relation => ({
    source,
    target,
    type,
    description: '',
    evidence: [],
});
const article = (id: string, concepts: string[], date = '2026-01-01'): Article => ({
    id,
    title: `${id} - 부제`,
    summary: null,
    description: null,
    date,
    updated: null,
    tags: [],
    concepts,
    url: `/post/${id}/`,
    references: [],
});

const data = (concepts: Concept[], relations: Relation[], articles: Article[]): KnowledgeData => ({
    categories: [{ id: 'jvm', name: 'JVM' }, { id: 'spring', name: 'Spring' }],
    concepts,
    relations,
    articles,
});

const BASE = data(
    [concept('jit'), concept('c1'), concept('c2'), concept('osr'), concept('latency', 'spring'), concept('warm-up', 'spring')],
    [relation('c1', 'jit', 'PART_OF'), relation('c2', 'jit', 'PART_OF'), relation('jit', 'latency', 'AFFECTS'), relation('warm-up', 'latency', 'AFFECTS'), relation('osr', 'c2')],
    [article('jit-post', ['jit', 'c1']), article('when-ready', ['jit', 'latency'], '2026-02-01')],
);

test('중심의 1-hop 개념과 글만 담고, 2-hop 은 펼치기 전에는 넣지 않는다', () => {
    const subgraph = buildSubgraph(createKnowledgeIndex(BASE), 'jit', { expanded: [], categoryFilter: null });
    assert.ok(subgraph);
    const ids = subgraph.nodes.map((node) => node.id).sort();
    assert.deepEqual(ids, ['article:jit-post', 'article:when-ready', 'concept:c1', 'concept:c2', 'concept:jit', 'concept:latency']);
    assert.equal(subgraph.nodes.find((node) => node.id === 'article:jit-post')?.label, 'jit-post');
});

test('펼친 개념의 이웃만 더하고, 접으면 다시 빠진다', () => {
    const index = createKnowledgeIndex(BASE);
    const expanded = buildSubgraph(index, 'jit', { expanded: ['c2', 'latency'], categoryFilter: null });
    const expandedNodes = expanded?.nodes.filter((node) => node.role === 'expanded') ?? [];
    assert.deepEqual(expandedNodes.map((node) => [node.refId, node.parentId]).sort(), [
        ['osr', 'concept:c2'],
        ['warm-up', 'concept:latency'],
    ]);
    const collapsed = buildSubgraph(index, 'jit', { expanded: [], categoryFilter: null });
    assert.equal(collapsed?.nodes.some((node) => node.role === 'expanded'), false);
});

test('같은 노드와 선을 두 번 넣지 않는다', () => {
    const subgraph = buildSubgraph(createKnowledgeIndex(BASE), 'jit', { expanded: ['c2', 'c2'], categoryFilter: null });
    const nodeIds = subgraph?.nodes.map((node) => node.id) ?? [];
    const edgeIds = subgraph?.edges.map((edge) => edge.id) ?? [];
    assert.equal(new Set(nodeIds).size, nodeIds.length);
    assert.equal(new Set(edgeIds).size, edgeIds.length);
});

test('분야 필터는 중심을 남기고 다른 분야의 개념을 뺀다', () => {
    const subgraph = buildSubgraph(createKnowledgeIndex(BASE), 'jit', { expanded: [], categoryFilter: 'spring' });
    const concepts = subgraph?.nodes.filter((node) => node.kind === 'concept').map((node) => node.refId).sort();
    assert.deepEqual(concepts, ['jit', 'latency']);
});

test('열마다 노드 수를 제한하고, 전체 노드 수가 넘치면 더 펼치지 않는다', () => {
    const many = Array.from({ length: 40 }, (_, position) => concept(`n${position}`));
    const leaves = Array.from({ length: 80 },(_, position) => concept(`leaf${position}`));
    const relations = [
        ...many.map((item) => relation(item.id, 'hub')),
        ...leaves.map((item, position) => relation(item.id, `n${position % MAX_PER_COLUMN}`)),
    ];
    const subgraph = buildSubgraph(createKnowledgeIndex(data([concept('hub'), ...many, ...leaves], relations, [])), 'hub', {
        expanded: many.slice(0, MAX_PER_COLUMN).map((item) => item.id),
        categoryFilter: null,
    });
    assert.ok(subgraph);
    assert.equal(subgraph.nodes.filter((node) => node.role === 'neighbor').length, MAX_PER_COLUMN);
    assert.equal(subgraph.hiddenCount, 40 - MAX_PER_COLUMN);
    assert.ok(subgraph.nodes.length <= MAX_NODES);
    assert.ok(subgraph.skippedExpansions.length > 0);
});

test('좌표는 결정적이고, 개념은 왼쪽, 글은 오른쪽이며 같은 열에서 겹치지 않는다', () => {
    const subgraph = buildSubgraph(createKnowledgeIndex(BASE), 'jit', { expanded: ['c2', 'latency'], categoryFilter: null });
    assert.ok(subgraph);
    const first = layoutSubgraph(subgraph);
    const second = layoutSubgraph(subgraph);
    assert.deepEqual([...first.entries()], [...second.entries()]);

    subgraph.nodes.forEach((node) => {
        const position = first.get(node.id);
        assert.ok(position, `${node.id} 좌표가 없다`);
        if (node.role === 'center') {
            assert.deepEqual([position.x, position.y], [0, 0]);
        } else {
            assert.equal(Math.sign(position.x), node.kind === 'article' ? 1 : -1, `${node.id} 가 반대쪽에 있다`);
        }
    });

    (['neighbor', 'expanded', 'article'] as const).forEach((role) => {
        const ys = subgraph.nodes
            .filter((node) => node.role === role)
            .map((node) => first.get(node.id)?.y ?? 0)
            .sort((a, b) => a - b);
        ys.slice(1).forEach((y, position) => {
            assert.ok(y - ys[position] >= ROW_GAP * 0.8, `${role} 열의 노드 간격이 너무 좁다`);
        });
    });
});

test('펼쳐도 이미 있던 노드의 좌표는 바뀌지 않는다', () => {
    const index = createKnowledgeIndex(BASE);
    const before = layoutSubgraph(buildSubgraph(index, 'jit', { expanded: [], categoryFilter: null })!);
    const after = layoutSubgraph(buildSubgraph(index, 'jit', { expanded: ['c2'], categoryFilter: null })!);
    before.forEach((position, id) => assert.deepEqual(after.get(id), position, `${id} 좌표가 바뀌었다`));
});

test('곡선 제어점은 양 끝에서 수평으로 나가는 S 자를 만든다', () => {
    const curve = edgeCurve({ x: 0, y: 0 }, { x: 200, y: 0 });
    assert.deepEqual(curve.distances.map((value) => Math.abs(value)), [0, 0]);
    const bent = edgeCurve({ x: 0, y: 0 }, { x: 200, y: 100 });
    assert.ok(bent.distances[0] < 0 && bent.distances[1] > 0);
});

test('전체 보기는 모든 개념과, 개념이 있는 글을 빠짐없이 넣는다', () => {
    const index = createKnowledgeIndex(BASE);
    const overview = buildOverview(index, null);
    assert.equal(overview.mode, 'overview');
    assert.equal(overview.nodes.filter((node) => node.kind === 'concept').length, BASE.concepts.length);
    assert.equal(overview.nodes.filter((node) => node.kind === 'article').length, BASE.articles.length);
    assert.equal(overview.edges.filter((edge) => edge.type === 'HUB').length, BASE.concepts.length);
    assert.equal(overview.edges.filter((edge) => edge.type === 'MENTIONS').length, 4);

    const spring = buildOverview(index, 'spring');
    assert.deepEqual(spring.nodes.filter((node) => node.kind === 'concept').map((node) => node.refId).sort(), ['latency', 'warm-up']);
    assert.deepEqual(spring.nodes.filter((node) => node.kind === 'article').map((node) => node.refId), ['when-ready']);
    // 분야 화면에서는 허브에서 글로만 잇는다.
    assert.deepEqual(spring.edges.filter((edge) => edge.type === 'MENTIONS').map((edge) => edge.source), [spring.centerId]);

    const positions = layoutSubgraph(overview);
    overview.nodes.forEach((node) => assert.ok(positions.has(node.id), `${node.id} 좌표가 없다`));
});

test('필터는 관계 유형과 노드 종류를 숨기고, 선이 모두 숨겨진 노드도 함께 숨긴다', () => {
    const subgraph = buildSubgraph(createKnowledgeIndex(BASE), 'jit', { expanded: ['c2'], categoryFilter: null });
    assert.ok(subgraph);
    const noPartOf = hiddenElementIds(subgraph, { hiddenKinds: [], hiddenRelationTypes: ['PART_OF'] });
    // c1, c2 는 PART_OF 로만 이어져 숨고, c2 를 거쳐 펼친 osr 도 따라 숨는다.
    ['concept:c1', 'concept:c2', 'concept:osr'].forEach((id) => assert.ok(noPartOf.has(id), `${id} 가 보인다`));
    ['concept:jit', 'concept:latency', 'article:jit-post'].forEach((id) => assert.ok(!noPartOf.has(id), `${id} 가 숨었다`));

    const noArticles = hiddenElementIds(subgraph, { hiddenKinds: ['article'], hiddenRelationTypes: [] });
    assert.deepEqual(
        subgraph.nodes.filter((node) => noArticles.has(node.id)).map((node) => node.kind),
        ['article', 'article'],
    );
    assert.ok(subgraph.edges.filter((edge) => edge.type === 'MENTIONS').every((edge) => noArticles.has(edge.id)));

    const noConcepts = hiddenElementIds(subgraph, { hiddenKinds: ['concept'], hiddenRelationTypes: [] });
    assert.ok(!noConcepts.has(subgraph.centerId), '중심 개념은 숨기지 않는다');
});

test('전체 보기에서 개념을 숨겨도 허브와 글은 남는다', () => {
    const overview = buildOverview(createKnowledgeIndex(BASE), null);
    const hidden = hiddenElementIds(overview, { hiddenKinds: ['concept'], hiddenRelationTypes: [] });
    assert.ok(!hidden.has(overview.centerId));
    assert.ok(overview.nodes.filter((node) => node.kind === 'article').every((node) => !hidden.has(node.id)));
    assert.ok(overview.nodes.filter((node) => node.kind === 'concept').every((node) => hidden.has(node.id)));
});
