import type { Article, Concept, Evidence, KnowledgeData, Relation } from './types';

// 화면에서 자주 찾는 값을 미리 묶어 둔다. 브라우저에서 쓰므로 Node 전용 모듈을 import 하지 않는다.

// 상세 패널에 보이는 노드. 중심 개념(탐색 상태)과는 따로 관리한다.
export interface Selection {
    // hub 는 전체 보기의 가운데 노드다. id 는 'all' 또는 분야 id 다.
    kind: 'concept' | 'article' | 'hub';
    id: string;
}

export interface KnowledgeIndex {
    conceptsById: Map<string, Concept>;
    articlesById: Map<string, Article>;
    categoryNames: Map<string, string>;
    articlesByConcept: Map<string, Article[]>;
    relationsByConcept: Map<string, Relation[]>;
}

export const createKnowledgeIndex = (data: KnowledgeData): KnowledgeIndex => {
    const articlesByConcept = new Map<string, Article[]>();
    data.articles.forEach((article) => {
        article.concepts.forEach((conceptId) => {
            articlesByConcept.set(conceptId, [...(articlesByConcept.get(conceptId) ?? []), article]);
        });
    });
    const relationsByConcept = new Map<string, Relation[]>();
    data.relations.forEach((relation) => {
        [relation.source, relation.target].forEach((conceptId) => {
            relationsByConcept.set(conceptId, [...(relationsByConcept.get(conceptId) ?? []), relation]);
        });
    });
    return {
        conceptsById: new Map(data.concepts.map((concept) => [concept.id, concept])),
        articlesById: new Map(data.articles.map((article) => [article.id, article])),
        categoryNames: new Map(data.categories.map((category) => [category.id, category.name])),
        articlesByConcept,
        relationsByConcept,
    };
};

export const RELATION_GROUPS = [
    { key: 'parents', label: '상위 개념' },
    { key: 'parts', label: '구성 요소' },
    { key: 'affectedBy', label: '영향을 주는 개념' },
    { key: 'affects', label: '영향을 받는 개념' },
    { key: 'related', label: '관련 개념' },
] as const;

export type RelationGroupKey = (typeof RELATION_GROUPS)[number]['key'];

export interface ConnectedConcept {
    conceptId: string;
    relation: Relation;
}

// 관계의 실제 방향을 기준으로, 이 개념에서 본 상대 개념을 의미별로 나눈다.
export const groupConceptRelations = (
    conceptId: string,
    relations: Relation[],
): Record<RelationGroupKey, ConnectedConcept[]> => {
    const groups: Record<RelationGroupKey, ConnectedConcept[]> = {
        parents: [],
        parts: [],
        affectedBy: [],
        affects: [],
        related: [],
    };
    relations.forEach((relation) => {
        const isSource = relation.source === conceptId;
        const isTarget = relation.target === conceptId;
        if (!isSource && !isTarget) {
            return;
        }
        const other = isSource ? relation.target : relation.source;
        const entry = { conceptId: other, relation };
        if (relation.type === 'PART_OF') {
            groups[isSource ? 'parents' : 'parts'].push(entry);
        } else if (relation.type === 'AFFECTS') {
            groups[isSource ? 'affects' : 'affectedBy'].push(entry);
        } else {
            groups.related.push(entry);
        }
    });
    return groups;
};

export interface RelationRow {
    conceptIds: string[];
    description: string;
    evidence: Evidence[];
}

// 상세 패널에서 관계를 한 줄씩 보여주기 위해, 설명이 같은 관계를 한 줄로 묶는다.
// 예를 들어 C1 과 C2 가 같은 문장으로 JIT 에 이어져 있으면 "C1, C2" 한 줄이 된다. 근거는 주소 기준으로 겹치지 않게 모은다.
export const mergeRelationRows = (entries: ConnectedConcept[]): RelationRow[] => {
    const rows = new Map<string, RelationRow>();
    entries.forEach(({ conceptId, relation }) => {
        const row = rows.get(relation.description) ?? { conceptIds: [], description: relation.description, evidence: [] };
        if (!row.conceptIds.includes(conceptId)) {
            row.conceptIds.push(conceptId);
        }
        relation.evidence
            .filter((item) => !row.evidence.some((existing) => existing.url === item.url))
            .forEach((item) => row.evidence.push(item));
        rows.set(relation.description, row);
    });
    return [...rows.values()];
};

// 관계의 근거 중 이 글에 있는 절만 골라, 글 카드에 "이 개념이 나오는 절"로 보여준다. 글 전체가 근거인 항목은 뺀다.
export const findSectionsInArticle = (relations: Relation[], articleId: string): Evidence[] => {
    const sections = new Map<string, Evidence>();
    relations
        .flatMap((relation) => relation.evidence)
        .filter((item) => item.articleId === articleId && item.heading !== null)
        .forEach((item) => sections.set(item.url, item));
    return [...sections.values()];
};

// 같은 개념을 많이 공유하는 글부터 돌려준다.
export const findArticlesSharingConcepts = (article: Article, articles: Article[], limit: number): Article[] => {
    return articles
        .filter((other) => other.id !== article.id)
        .map((other) => ({ other, shared: other.concepts.filter((id) => article.concepts.includes(id)).length }))
        .filter(({ shared }) => shared > 0)
        .sort((a, b) => b.shared - a.shared || b.other.date.localeCompare(a.other.date))
        .slice(0, limit)
        .map(({ other }) => other);
};

export const findMostConnectedConcept = (data: KnowledgeData): string | null => {
    const degree = new Map<string, number>();
    const add = (conceptId: string): void => {
        degree.set(conceptId, (degree.get(conceptId) ?? 0) + 1);
    };
    data.relations.forEach((relation) => {
        add(relation.source);
        add(relation.target);
    });
    data.articles.forEach((article) => article.concepts.forEach(add));
    let best: string | null = null;
    data.concepts.forEach((concept) => {
        if (best === null || (degree.get(concept.id) ?? 0) > (degree.get(best) ?? 0)) {
            best = concept.id;
        }
    });
    return best;
};
