import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildKnowledge } from './build';
import type { ArticleSource, RawKnowledge } from './build';
import {
    buildClassifyMessages,
    classifyArticleWithGemma,
    extractJsonText,
    formatReviewMarkdown,
    mergeArticleConcepts,
    parseClassifyResponse,
    prepareArticleBody,
    serializeArticlesJson,
    validateProposedConcepts,
} from './classify';
import type { ClassifyArticleInput, CompletionRequester } from './classify';
import type { Concept } from './types';

const SAMPLE_CONCEPTS: Concept[] = [
    {
        id: 'kubernetes-probe',
        name: 'Kubernetes Probe',
        category: 'kubernetes',
        aliases: ['Probe'],
        description: '컨테이너 상태를 점검하는 프로브 개념',
    },
    {
        id: 'liveness-probe',
        name: 'Liveness Probe',
        category: 'kubernetes',
        aliases: ['Liveness'],
        description: '컨테이너 생존 여부를 확인해 재시작을 판단한다',
    },
    {
        id: 'readiness-probe',
        name: 'Readiness Probe',
        category: 'kubernetes',
        aliases: ['Readiness'],
        description: '트래픽을 받을 준비가 되었는지 확인한다',
    },
    {
        id: 'actuator-health',
        name: 'Actuator Health',
        category: 'spring',
        aliases: ['Spring Actuator'],
        description: 'Spring Boot 상태 확인 엔드포인트',
    },
];

const SAMPLE_ARTICLE: ClassifyArticleInput = {
    id: 'kubernetes-probes',
    title: 'Kubernetes Probe 정리',
    summary: 'Liveness 와 Readiness 차이',
    description: '프로브 동작 원리 설명',
    tags: ['Kubernetes', 'Spring'],
    content: '## 개요\nLiveness Probe 와 Readiness Probe 를 설명한다.',
};

test('prepareArticleBody 는 긴 코드 블록을 축약하고 본문 구조는 유지한다', () => {
    const longCode = 'const value = 1;\n'.repeat(60);
    const raw = `## 제목\n본문 설명\n\`\`\`ts\n${longCode}\`\`\`\n## 마무리`;
    const prepared = prepareArticleBody(raw);

    assert.ok(prepared.includes('## 제목'));
    assert.ok(prepared.includes('... [코드 블록 생략]'));
    assert.ok(prepared.includes('## 마무리'));
});

test('buildClassifyMessages 는 고정 개념 목록을 system 에 두고 글 본문을 article 태그로 감싼다', () => {
    const messages = buildClassifyMessages({
        concepts: SAMPLE_CONCEPTS,
        article: SAMPLE_ARTICLE,
        maxConcepts: 5,
    });

    assert.equal(messages.length, 2);
    assert.equal(messages[0].role, 'system');
    assert.ok(messages[0].content.includes('liveness-probe'));
    assert.ok(messages[0].content.includes('최대 5개'));
    assert.equal(messages[1].role, 'user');
    assert.ok(messages[1].content.includes('<article>'));
    assert.ok(!messages[1].content.includes('현재 연결된 개념 ID'));
});

test('extractJsonText 와 parseClassifyResponse 는 코드펜스와 앞뒤 텍스트가 섞여도 JSON 을 파싱한다', () => {
    const responseText = [
        '분석 결과는 아래와 같습니다.',
        '```json',
        '{"concepts":[{"id":"liveness-probe","reason":"생존 확인 원리를 설명함"}],"notes":"startupProbe 참고"}',
        '```',
    ].join('\n');

    assert.ok(extractJsonText(responseText).startsWith('{'));
    const parsed = parseClassifyResponse(responseText);
    assert.deepEqual(parsed, {
        concepts: [{ id: 'liveness-probe', reason: '생존 확인 원리를 설명함' }],
        notes: 'startupProbe 참고',
    });
});

test('validateProposedConcepts 는 유효 ID, 없는 ID, 중복 ID 를 분리한다', () => {
    const validIds = new Set(SAMPLE_CONCEPTS.map((concept) => concept.id));
    const summary = validateProposedConcepts({
        proposed: [
            { id: 'liveness-probe', reason: '근거 1' },
            { id: 'liveness-probe', reason: '중복' },
            { id: 'unknown-concept', reason: '환각' },
            { id: 'readiness-probe', reason: '근거 2' },
        ],
        validConceptIds: validIds,
        maxConcepts: 6,
    });

    assert.deepEqual(
        summary.validConcepts.map((item) => item.id),
        ['liveness-probe', 'readiness-probe'],
    );
    assert.deepEqual(summary.invalidIds, ['unknown-concept']);
    assert.deepEqual(summary.duplicateIds, ['liveness-probe']);
});

test('mergeArticleConcepts 는 append 와 replace 정책을 각각 정확히 적용하고 다른 글은 건드리지 않는다', () => {
    const baseArticles: Record<string, string[]> = {
        'kubernetes-probes': ['kubernetes-probe', 'actuator-health'],
        'other-post': ['liveness-probe'],
    };

    const appended = mergeArticleConcepts({
        articles: baseArticles,
        articleId: 'kubernetes-probes',
        proposedIds: ['liveness-probe', 'kubernetes-probe'],
        policy: 'append',
    });
    assert.equal(appended.status, 'updated');
    assert.deepEqual(appended.finalIds, ['kubernetes-probe', 'actuator-health', 'liveness-probe']);
    assert.deepEqual(appended.addedIds, ['liveness-probe']);
    assert.deepEqual(appended.removedIds, []);
    assert.deepEqual(appended.nextArticles['other-post'], ['liveness-probe']);

    const replaced = mergeArticleConcepts({
        articles: baseArticles,
        articleId: 'kubernetes-probes',
        proposedIds: ['liveness-probe', 'readiness-probe'],
        policy: 'replace',
    });
    assert.equal(replaced.status, 'updated');
    assert.deepEqual(replaced.finalIds, ['liveness-probe', 'readiness-probe']);
    assert.deepEqual(replaced.addedIds, ['liveness-probe', 'readiness-probe']);
    assert.deepEqual(replaced.removedIds, ['kubernetes-probe', 'actuator-health']);
    assert.deepEqual(replaced.nextArticles['other-post'], ['liveness-probe']);
});

test('mergeArticleConcepts 는 0개 매칭 시 articles.json 에 빈 배열을 쓰지 않는다', () => {
    const baseArticles: Record<string, string[]> = {
        'other-post': ['liveness-probe'],
    };

    const result = mergeArticleConcepts({
        articles: baseArticles,
        articleId: 'kubernetes-probes',
        proposedIds: [],
        policy: 'append',
    });

    assert.equal(result.status, 'no_match');
    assert.equal(result.nextArticles['kubernetes-probes'], undefined);
    assert.deepEqual(result.nextArticles, baseArticles);
});

test('serializeArticlesJson 은 4칸 들여쓰기와 끝 개행을 유지한다', () => {
    const json = serializeArticlesJson({ 'kubernetes-probes': ['liveness-probe'] });
    assert.equal(json, '{\n    "kubernetes-probes": [\n        "liveness-probe"\n    ]\n}\n');
});

test('buildKnowledge 검증은 잘못된 ID 와 중복 ID, 빈 배열을 오류로 거부한다', () => {
    const sources: ArticleSource[] = [
        {
            id: 'kubernetes-probes',
            filePath: 'contents/posts/kubernetes/kubernetes-probes.mdx',
            frontmatter: { title: 'Kubernetes Probe 정리', date: '2026-11-01' },
            content: '## 개요',
        },
    ];
    const baseRaw = (articles: unknown): RawKnowledge => ({
        categories: [{ id: 'kubernetes', name: 'Kubernetes' }, { id: 'spring', name: 'Spring' }],
        concepts: SAMPLE_CONCEPTS,
        relations: [],
        articles,
    });

    const invalidResult = buildKnowledge(baseRaw({ 'kubernetes-probes': ['liveness-probe', 'ghost-id'] }), sources);
    assert.ok(invalidResult.errors.some((error) => error.includes('ghost-id')));

    const duplicateResult = buildKnowledge(baseRaw({ 'kubernetes-probes': ['liveness-probe', 'liveness-probe'] }), sources);
    assert.ok(duplicateResult.errors.some((error) => error.includes('중복')));

    const emptyResult = buildKnowledge(baseRaw({ 'kubernetes-probes': [] }), sources);
    assert.ok(emptyResult.errors.some((error) => error.includes('하나 이상')));
});

test('classifyArticleWithGemma 는 첫 응답 형식이 깨지면 1회 재시도해 복구한다', async () => {
    let callCount = 0;
    const requester: CompletionRequester = async () => {
        callCount += 1;
        if (callCount === 1) {
            return { content: '형식이 잘못된 응답', finishReason: 'stop' };
        }
        return {
            content: '{"concepts":[{"id":"liveness-probe","reason":"핵심 주제"}],"notes":null}',
            finishReason: 'stop',
            usage: { promptTokens: 500, completionTokens: 40, cachedTokens: 420 },
        };
    };

    const result = await classifyArticleWithGemma({
        concepts: SAMPLE_CONCEPTS,
        article: SAMPLE_ARTICLE,
        requester,
    });

    assert.equal(callCount, 2);
    assert.equal(result.attempts, 2);
    assert.deepEqual(result.parsed.concepts, [{ id: 'liveness-probe', reason: '핵심 주제' }]);
});

test('formatReviewMarkdown 은 변경 표와 참고 메모, 체크리스트를 포함한다', () => {
    const conceptsById = new Map(SAMPLE_CONCEPTS.map((concept) => [concept.id, concept]));
    const validation = validateProposedConcepts({
        proposed: [{ id: 'liveness-probe', reason: '생존 여부 확인 설명' }],
        validConceptIds: new Set(conceptsById.keys()),
    });
    const merge = mergeArticleConcepts({
        articles: {},
        articleId: SAMPLE_ARTICLE.id,
        proposedIds: ['liveness-probe'],
        policy: 'append',
    });

    const markdown = formatReviewMarkdown({
        article: SAMPLE_ARTICLE,
        conceptsById,
        mergePolicy: 'append',
        validation,
        merge,
        notes: '새 개념 후보는 수동 검토 필요',
        model: 'gemma-4-26b-a4b-it',
        isDryRun: false,
        checkErrors: [],
    });

    assert.ok(markdown.includes('`liveness-probe`'));
    assert.ok(markdown.includes('생존 여부 확인 설명'));
    assert.ok(markdown.includes('새 개념 후보는 수동 검토 필요'));
    assert.ok(markdown.includes('check-knowledge'));
});
