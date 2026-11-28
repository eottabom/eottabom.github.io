// 그래프와 상세 패널이 같이 쓰는 색. 그래프 라이브러리에 의존하지 않는다.

export const CONCEPT_COLOR = '#4fb3a3';
// 글은 색을 채운 카드다. Spring(청록), Database(라임) 분야 색보다 짙은 에메랄드로 구분한다.
export const ARTICLE_COLOR = '#059669';

export const CATEGORY_COLORS: Record<string, string> = {
    jvm: '#f59e0b',
    spring: '#4fb3a3',
    kubernetes: '#3b82f6',
    java: '#ef4444',
    network: '#06b6d4',
    database: '#84cc16',
    architecture: '#ec4899',
};

export const categoryColor = (categoryId: string | null | undefined): string => {
    return CATEGORY_COLORS[categoryId ?? ''] ?? CONCEPT_COLOR;
};
