import { extractHeadings, extractInternalLinks } from './links';
import type { Heading } from './links';
import { RELATION_TYPES, articleUrl } from './types';
import type { Article, Category, Concept, Evidence, KnowledgeData, Relation, RelationType } from './types';

// 원본 데이터를 검증하고 KnowledgeData 로 조립한다. 파일을 읽지 않는 순수 함수라서 테스트에서 바로 쓸 수 있다.

const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export interface ArticleSource {
    id: string;
    filePath: string;
    frontmatter: Record<string, unknown>;
    content: string;
}

export interface RawKnowledge {
    categories: unknown;
    concepts: unknown;
    relations: unknown;
    // 게시글 id 를 key 로, 그 글이 다루는 concept id 목록을 값으로 둔다. 게시글 파일은 건드리지 않는다.
    articles: unknown;
}

export interface KnowledgeResult {
    data: KnowledgeData;
    errors: string[];
    warnings: string[];
}

interface ParsedArticle {
    source: ArticleSource;
    title: string;
    headings: Heading[];
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isStringArray = (value: unknown): value is string[] => {
    return Array.isArray(value) && value.every((item) => typeof item === 'string');
};

const isNonEmptyString = (value: unknown): value is string => {
    return typeof value === 'string' && value.trim() !== '';
};

const optionalString = (value: unknown): string | null => {
    return isNonEmptyString(value) ? value : null;
};

const toDateString = (value: unknown): string | null => {
    if (value instanceof Date) {
        return value.toISOString().slice(0, 10);
    }
    return optionalString(value);
};

const parseCategories = (raw: unknown, errors: string[]): Category[] => {
    if (!Array.isArray(raw)) {
        errors.push('categories.json 은 배열이어야 한다');
        return [];
    }
    const categories: Category[] = [];
    raw.forEach((item, index) => {
        const label = `categories.json[${index}]`;
        if (!isRecord(item) || typeof item.id !== 'string' || !ID_PATTERN.test(item.id)) {
            errors.push(`${label}: id 는 소문자 kebab-case 문자열이어야 한다`);
            return;
        }
        if (!isNonEmptyString(item.name)) {
            errors.push(`${label}: name 이 비어 있다 (${item.id})`);
            return;
        }
        if (categories.some((category) => category.id === item.id)) {
            errors.push(`${label}: 중복 category id (${item.id})`);
            return;
        }
        categories.push({ id: item.id, name: item.name });
    });
    return categories;
};

const parseConcepts = (raw: unknown, categoryIds: Set<string>, errors: string[]): Concept[] => {
    if (!Array.isArray(raw)) {
        errors.push('concepts.json 은 배열이어야 한다');
        return [];
    }
    const concepts: Concept[] = [];
    raw.forEach((item, index) => {
        const label = `concepts.json[${index}]`;
        if (!isRecord(item) || typeof item.id !== 'string' || !ID_PATTERN.test(item.id)) {
            errors.push(`${label}: id 는 소문자 kebab-case 문자열이어야 한다`);
            return;
        }
        const { id, name, category, aliases, description } = item;
        if (concepts.some((concept) => concept.id === id)) {
            errors.push(`${label}: 중복 concept id (${id})`);
            return;
        }
        if (!isNonEmptyString(name)) {
            errors.push(`${label}: name 이 비어 있다 (${id})`);
            return;
        }
        if (typeof category !== 'string' || !categoryIds.has(category)) {
            errors.push(`${label}: categories.json 에 없는 category (${id}: ${String(category)})`);
            return;
        }
        if (aliases !== undefined && !isStringArray(aliases)) {
            errors.push(`${label}: aliases 는 문자열 배열이어야 한다 (${id})`);
            return;
        }
        if (!isNonEmptyString(description)) {
            errors.push(`${label}: description 이 비어 있다 (${id})`);
            return;
        }
        concepts.push({ id, name, category, aliases: isStringArray(aliases) ? aliases : [], description });
    });
    return concepts;
};

const findDuplicateArticleIds = (sources: ArticleSource[], errors: string[]): void => {
    const pathsById = new Map<string, string[]>();
    sources.forEach((source) => {
        pathsById.set(source.id, [...(pathsById.get(source.id) ?? []), source.filePath]);
    });
    pathsById.forEach((paths, id) => {
        if (paths.length > 1) {
            errors.push(`중복 게시글 id (${id}): ${paths.join(', ')}`);
        }
    });
};

const parseArticleMapping = (
    raw: unknown,
    articleIds: Set<string>,
    conceptIds: Set<string>,
    errors: string[],
): Map<string, string[]> => {
    const mapping = new Map<string, string[]>();
    if (!isRecord(raw)) {
        errors.push('articles.json 은 { "게시글 id": ["concept id"] } 형태의 객체여야 한다');
        return mapping;
    }
    Object.entries(raw).forEach(([articleId, value]) => {
        const label = `articles.json["${articleId}"]`;
        if (!articleIds.has(articleId)) {
            errors.push(`${label}: 없는 게시글 (contents/posts 에 ${articleId}.mdx 가 없다)`);
            return;
        }
        if (!isStringArray(value) || value.length === 0) {
            errors.push(`${label}: concept id 를 하나 이상 담은 문자열 배열이어야 한다`);
            return;
        }
        const unknownIds = value.filter((id) => !conceptIds.has(id));
        if (unknownIds.length > 0) {
            errors.push(`${label}: concepts.json 에 없는 concept (${unknownIds.join(', ')})`);
        }
        if (new Set(value).size !== value.length) {
            errors.push(`${label}: concept 중복이 있다`);
        }
        mapping.set(articleId, [...new Set(value.filter((id) => conceptIds.has(id)))]);
    });
    return mapping;
};

const resolveEvidence = (
    raw: unknown,
    label: string,
    articlesById: Map<string, ParsedArticle>,
    errors: string[],
): Evidence | null => {
    if (!isRecord(raw) || !isNonEmptyString(raw.articleId)) {
        errors.push(`${label}: evidence 에 articleId 가 필요하다`);
        return null;
    }
    const article = articlesById.get(raw.articleId);
    if (!article) {
        errors.push(`${label}: 없는 근거 게시글 (${raw.articleId})`);
        return null;
    }
    const heading = optionalString(raw.heading);
    const anchor = optionalString(raw.anchor);
    const base = { articleId: article.source.id, articleTitle: article.title };

    if (anchor !== null) {
        const found = article.headings.find((item) => item.anchor === anchor);
        if (!found) {
            errors.push(`${label}: ${article.source.id} 에 없는 앵커 (#${anchor})`);
            return null;
        }
        if (heading !== null && found.text !== heading) {
            errors.push(`${label}: 앵커 #${anchor} 의 제목은 "${found.text}" 인데 heading 은 "${heading}" 이다`);
            return null;
        }
        return { ...base, heading: found.text, anchor, url: articleUrl(article.source.id, anchor) };
    }
    if (heading === null) {
        return { ...base, heading: null, anchor: null, url: articleUrl(article.source.id) };
    }
    const matches = article.headings.filter((item) => item.text === heading);
    if (matches.length === 0) {
        errors.push(`${label}: ${article.source.id} 에 "${heading}" 제목이 없다`);
        return null;
    }
    if (matches.length > 1) {
        const anchors = matches.map((item) => `#${item.anchor}`).join(', ');
        errors.push(`${label}: ${article.source.id} 에 "${heading}" 제목이 여러 개라 anchor 를 지정해야 한다 (${anchors})`);
        return null;
    }
    return { ...base, heading, anchor: matches[0].anchor, url: articleUrl(article.source.id, matches[0].anchor) };
};

const relationKey = (source: string, target: string, type: RelationType): string => {
    const ends = type === 'RELATED_TO' ? [source, target].sort() : [source, target];
    return [type, ...ends].join(':');
};

const parseRelations = (
    raw: unknown,
    conceptIds: Set<string>,
    articlesById: Map<string, ParsedArticle>,
    errors: string[],
): Relation[] => {
    if (!Array.isArray(raw)) {
        errors.push('relations.json 은 배열이어야 한다');
        return [];
    }
    const relations: Relation[] = [];
    const seenKeys = new Set<string>();

    raw.forEach((item, index) => {
        const label = `relations.json[${index}]`;
        if (!isRecord(item)) {
            errors.push(`${label}: 객체가 아니다`);
            return;
        }
        const { source, target, type, description, evidence } = item;
        if (typeof source !== 'string' || !conceptIds.has(source)) {
            errors.push(`${label}: 없는 concept (source: ${String(source)})`);
            return;
        }
        if (typeof target !== 'string' || !conceptIds.has(target)) {
            errors.push(`${label}: 없는 concept (target: ${String(target)})`);
            return;
        }
        if (source === target) {
            errors.push(`${label}: 자기 자신을 가리키는 관계 (${source})`);
            return;
        }
        if (!RELATION_TYPES.includes(type as RelationType)) {
            errors.push(`${label}: 알 수 없는 관계 유형 (${String(type)}), 허용 값: ${RELATION_TYPES.join(', ')}`);
            return;
        }
        const relationType = type as RelationType;
        const key = relationKey(source, target, relationType);
        if (seenKeys.has(key)) {
            errors.push(`${label}: 중복 관계 (${source} ${relationType} ${target})`);
            return;
        }
        if (!isNonEmptyString(description)) {
            errors.push(`${label}: description 이 비어 있다 (${source} ${relationType} ${target})`);
            return;
        }
        if (!Array.isArray(evidence) || evidence.length === 0) {
            errors.push(`${label}: evidence 가 하나 이상 필요하다 (${source} ${relationType} ${target})`);
            return;
        }
        const resolved = evidence.map((entry, entryIndex) =>
            resolveEvidence(entry, `${label}.evidence[${entryIndex}]`, articlesById, errors),
        );
        if (resolved.some((entry) => entry === null)) {
            return;
        }
        seenKeys.add(key);
        relations.push({ source, target, type: relationType, description, evidence: resolved as Evidence[] });
    });
    return relations;
};

export const buildKnowledge = (raw: RawKnowledge, sources: ArticleSource[]): KnowledgeResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    findDuplicateArticleIds(sources, errors);
    const categories = parseCategories(raw.categories, errors);
    const concepts = parseConcepts(raw.concepts, new Set(categories.map((category) => category.id)), errors);
    const conceptIds = new Set(concepts.map((concept) => concept.id));

    const parsed: ParsedArticle[] = sources.map((source) => ({
        source,
        title: isNonEmptyString(source.frontmatter.title) ? source.frontmatter.title : source.id,
        headings: extractHeadings(source.content),
    }));
    const articlesById = new Map(parsed.map((article) => [article.source.id, article]));
    const relations = parseRelations(raw.relations, conceptIds, articlesById, errors);
    const mapping = parseArticleMapping(raw.articles, new Set(articlesById.keys()), conceptIds, errors);

    const articles: Article[] = parsed
        .map((article) => ({ article, concepts: mapping.get(article.source.id) ?? [] }))
        .filter(({ concepts: articleConcepts }) => articleConcepts.length > 0)
        .map(({ article, concepts: articleConcepts }) => {
            const { source } = article;
            const references = extractInternalLinks(source.content)
                .filter((id) => id !== source.id)
                .flatMap((id) => {
                    const target = articlesById.get(id);
                    if (!target) {
                        warnings.push(`${source.filePath}: 없는 게시글로 가는 내부 링크 (/post/${id})`);
                        return [];
                    }
                    return [{ id, title: target.title, url: articleUrl(id) }];
                });
            return {
                id: source.id,
                title: article.title,
                summary: optionalString(source.frontmatter.summary),
                description: optionalString(source.frontmatter.description),
                date: toDateString(source.frontmatter.date) ?? '',
                updated: toDateString(source.frontmatter.updated),
                tags: isStringArray(source.frontmatter.tags) ? source.frontmatter.tags : [],
                concepts: articleConcepts,
                url: articleUrl(source.id),
                references,
            };
        })
        .sort((a, b) => b.date.localeCompare(a.date));

    const linkedConceptIds = new Set([
        ...articles.flatMap((article) => article.concepts),
        ...relations.flatMap((relation) => [relation.source, relation.target]),
    ]);
    concepts
        .filter((concept) => !linkedConceptIds.has(concept.id))
        .forEach((concept) => warnings.push(`게시글과 관계 어디에도 연결되지 않은 concept: ${concept.id}`));

    return { data: { categories, concepts, relations, articles }, errors, warnings };
};
