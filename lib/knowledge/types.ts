// Knowledge 데이터 타입. 브라우저와 빌드 양쪽에서 쓰므로 Node 전용 모듈을 import 하지 않는다.

export const RELATION_TYPES = ['PART_OF', 'AFFECTS', 'RELATED_TO'] as const;
export type RelationType = (typeof RELATION_TYPES)[number];

// PART_OF: source 는 target 의 구성 요소다.
// AFFECTS: source 가 target 의 동작, 성능, 비용에 영향을 준다.
// RELATED_TO: 방향이 없다. source 와 target 을 바꿔도 같은 관계다.
export const DIRECTED_RELATION_TYPES: readonly RelationType[] = ['PART_OF', 'AFFECTS'];

export interface Category {
    id: string;
    name: string;
}

export interface Concept {
    id: string;
    name: string;
    category: string;
    aliases: string[];
    description: string;
}

export interface Evidence {
    articleId: string;
    articleTitle: string;
    // null 이면 게시글 전체가 근거다.
    heading: string | null;
    anchor: string | null;
    url: string;
}

export interface Relation {
    source: string;
    target: string;
    type: RelationType;
    description: string;
    evidence: Evidence[];
}

export interface ArticleReference {
    id: string;
    title: string;
    url: string;
}

export interface Article {
    id: string;
    title: string;
    summary: string | null;
    description: string | null;
    date: string;
    updated: string | null;
    tags: string[];
    concepts: string[];
    url: string;
    // 본문의 내부 링크로 참조한 다른 게시글. 개념 간 관계와는 별개인 문서 간 참조다.
    references: ArticleReference[];
}

export interface KnowledgeData {
    categories: Category[];
    concepts: Concept[];
    relations: Relation[];
    articles: Article[];
}

export const conceptNodeId = (conceptId: string): string => `concept:${conceptId}`;
export const articleNodeId = (articleId: string): string => `article:${articleId}`;
export const articleUrl = (articleId: string, anchor?: string | null): string => {
    return anchor ? `/post/${articleId}/#${anchor}` : `/post/${articleId}/`;
};
