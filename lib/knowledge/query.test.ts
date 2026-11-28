import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findSectionsInArticle, groupConceptRelations, mergeRelationRows } from './query';
import type { Evidence, Relation, RelationType } from './types';

const relation = (source: string, target: string, type: RelationType): Relation => ({
    source,
    target,
    type,
    description: '',
    evidence: [],
});

test('관계의 실제 방향으로 상위, 구성 요소, 영향을 나눈다', () => {
    const relations = [
        relation('tiered-compilation', 'jit', 'PART_OF'),
        relation('jit', 'first-request-latency', 'AFFECTS'),
        relation('warm-up', 'first-request-latency', 'AFFECTS'),
        relation('interpreter', 'jit', 'RELATED_TO'),
    ];
    const jit = groupConceptRelations('jit', relations);
    assert.deepEqual(jit.parts.map(({ conceptId }) => conceptId), ['tiered-compilation']);
    assert.deepEqual(jit.affects.map(({ conceptId }) => conceptId), ['first-request-latency']);
    assert.deepEqual(jit.related.map(({ conceptId }) => conceptId), ['interpreter']);
    assert.deepEqual(jit.parents, []);

    const latency = groupConceptRelations('first-request-latency', relations);
    assert.deepEqual(latency.affectedBy.map(({ conceptId }) => conceptId), ['jit', 'warm-up']);

    const tiered = groupConceptRelations('tiered-compilation', relations);
    assert.deepEqual(tiered.parents.map(({ conceptId }) => conceptId), ['jit']);
});

const evidence = (articleId: string, heading: string | null): Evidence => ({
    articleId,
    articleTitle: `${articleId} 글`,
    heading,
    anchor: heading,
    url: `/post/${articleId}/${heading ? `#${heading}` : ''}`,
});

test('설명이 같은 관계는 한 줄로 묶고, 근거는 주소 기준으로 겹치지 않게 모은다', () => {
    const shared = evidence('jit-post', 'JIT 컴파일 과정');
    const rows = mergeRelationRows([
        { conceptId: 'c1', relation: { ...relation('c1', 'jit', 'PART_OF'), description: '두 가지가 있다.', evidence: [shared] } },
        { conceptId: 'c2', relation: { ...relation('c2', 'jit', 'PART_OF'), description: '두 가지가 있다.', evidence: [shared] } },
        { conceptId: 'osr', relation: { ...relation('osr', 'jit', 'PART_OF'), description: '실행 중 교체한다.', evidence: [] } },
    ]);
    assert.deepEqual(rows.map((row) => row.conceptIds), [['c1', 'c2'], ['osr']]);
    assert.equal(rows[0].evidence.length, 1);
});

test('글 카드에는 그 글의 절 근거만 겹치지 않게 보여주고, 글 전체 근거는 뺀다', () => {
    const relations = [
        { ...relation('c1', 'jit', 'PART_OF'), evidence: [evidence('jit-post', '과정'), evidence('other-post', '과정')] },
        { ...relation('c2', 'jit', 'PART_OF'), evidence: [evidence('jit-post', '과정'), evidence('jit-post', null)] },
    ];
    assert.deepEqual(findSectionsInArticle(relations, 'jit-post').map((item) => item.heading), ['과정']);
});
