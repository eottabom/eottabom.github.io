// 정규화한 부분 문자열 검색. 그래프나 Knowledge 에 묶이지 않아서 다른 목록 페이지에서도 쓸 수 있다.

export interface SearchField {
    value: string;
    weight: number;
}

export interface SearchDocument<T> {
    item: T;
    fields: SearchField[];
}

// 필드 값을 normalizeText 로 정규화해 둔 문서. 검색할 때마다 정규화하지 않도록 한 번만 만든다.
export type IndexedDocument<T> = SearchDocument<T>;

export interface SearchResult<T> {
    item: T;
    score: number;
}

const EXACT_MATCH_BONUS = 3;
const PREFIX_MATCH_BONUS = 1.5;

// 대소문자, 전각/반각, 공백 차이를 없앤다. "첫요청" 으로도 "첫 요청" 을 찾을 수 있다.
export const normalizeText = (value: string): string => {
    return value.normalize('NFKC').toLowerCase().replace(/\s+/g, '');
};

export const indexDocuments = <T>(documents: SearchDocument<T>[]): IndexedDocument<T>[] => {
    return documents.map(({ item, fields }) => ({
        item,
        fields: fields
            .filter((field) => field.value.trim() !== '')
            .map((field) => ({ value: normalizeText(field.value), weight: field.weight })),
    }));
};

const scoreToken = (fields: SearchField[], token: string): number => {
    return fields.reduce((best, field) => {
        if (!field.value.includes(token)) {
            return best;
        }
        let score = field.weight;
        if (field.value === token) {
            score *= EXACT_MATCH_BONUS;
        } else if (field.value.startsWith(token)) {
            score *= PREFIX_MATCH_BONUS;
        }
        return Math.max(best, score);
    }, 0);
};

// 검색어를 공백으로 나눠 모든 단어가 어느 필드에든 들어 있는 문서만 남기고, 가중치 합이 큰 순서로 돌려준다.
export const searchDocuments = <T>(documents: IndexedDocument<T>[], query: string): SearchResult<T>[] => {
    const tokens = query.split(/\s+/).map(normalizeText).filter((token) => token !== '');
    if (tokens.length === 0) {
        return [];
    }
    const results: SearchResult<T>[] = [];
    documents.forEach(({ item, fields }) => {
        let total = 0;
        for (const token of tokens) {
            const score = scoreToken(fields, token);
            if (score === 0) {
                return;
            }
            total += score;
        }
        results.push({ item, score: total });
    });
    return results.sort((a, b) => b.score - a.score);
};
