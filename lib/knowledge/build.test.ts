import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildKnowledge } from './build';
import type { ArticleSource, RawKnowledge } from './build';

const article = (id: string, content: string, frontmatter: Record<string, unknown> = {}): ArticleSource => ({
    id,
    filePath: `contents/posts/${id}.mdx`,
    frontmatter: { title: `${id} 제목`, date: '2026-11-01', ...frontmatter },
    content,
});

const SOURCES: ArticleSource[] = [
    article('jit-post', '## JIT 컴파일 과정\n## 정리\n## 정리\n[다른 글](/post/other-post)\n[없는 글](/post/missing)'),
    article('other-post', '## 본문'),
];

const raw = (overrides: Partial<RawKnowledge> = {}): RawKnowledge => ({
    categories: [{ id: 'jvm', name: 'JVM' }],
    concepts: [
        { id: 'jit', name: 'JIT 컴파일', category: 'jvm', aliases: ['JIT'], description: '설명' },
        { id: 'c1-compiler', name: 'C1', category: 'jvm', description: '설명' },
    ],
    relations: [
        {
            source: 'c1-compiler',
            target: 'jit',
            type: 'PART_OF',
            description: '관계 설명',
            evidence: [{ articleId: 'jit-post', heading: 'JIT 컴파일 과정' }],
        },
    ],
    articles: { 'jit-post': ['jit', 'c1-compiler'] },
    ...overrides,
});

test('정상 데이터는 오류 없이 조립되고 근거 URL 에 앵커가 붙는다', () => {
    const { data, errors } = buildKnowledge(raw(), SOURCES);
    assert.deepEqual(errors, []);
    assert.equal(data.relations[0].evidence[0].url, '/post/jit-post/#jit-컴파일-과정');
    assert.equal(data.relations[0].evidence[0].articleTitle, 'jit-post 제목');
});

test('매핑이 없는 게시글은 Knowledge 에 넣지 않고, 내부 링크는 문서 참조로만 남긴다', () => {
    const { data, warnings } = buildKnowledge(raw(), SOURCES);
    assert.deepEqual(data.articles.map((item) => item.id), ['jit-post']);
    assert.deepEqual(data.articles[0].references, [{ id: 'other-post', title: 'other-post 제목', url: '/post/other-post/' }]);
    assert.ok(warnings.some((warning) => warning.includes('/post/missing')));
});

test('RELATED_TO 는 방향을 바꿔도 중복으로 본다', () => {
    const related = (source: string, target: string) => ({
        source,
        target,
        type: 'RELATED_TO',
        description: '설명',
        evidence: [{ articleId: 'jit-post' }],
    });
    const { errors } = buildKnowledge(raw({ relations: [related('jit', 'c1-compiler'), related('c1-compiler', 'jit')] }), SOURCES);
    assert.ok(errors.some((error) => error.includes('중복 관계')));
});

test('방향이 있는 관계는 반대 방향을 중복으로 보지 않는다', () => {
    const affects = (source: string, target: string) => ({
        source,
        target,
        type: 'AFFECTS',
        description: '설명',
        evidence: [{ articleId: 'jit-post' }],
    });
    const { errors } = buildKnowledge(raw({ relations: [affects('jit', 'c1-compiler'), affects('c1-compiler', 'jit')] }), SOURCES);
    assert.deepEqual(errors, []);
});

test('heading 을 생략하면 게시글 전체가 근거가 된다', () => {
    const relations = [{ source: 'c1-compiler', target: 'jit', type: 'PART_OF', description: '설명', evidence: [{ articleId: 'jit-post' }] }];
    const { data } = buildKnowledge(raw({ relations }), SOURCES);
    assert.equal(data.relations[0].evidence[0].heading, null);
    assert.equal(data.relations[0].evidence[0].url, '/post/jit-post/');
});

test('같은 제목이 여러 번 나오면 anchor 를 요구하고, anchor 로 지정하면 통과한다', () => {
    const withEvidence = (evidence: Record<string, string>) => [
        { source: 'c1-compiler', target: 'jit', type: 'PART_OF', description: '설명', evidence: [evidence] },
    ];
    const ambiguous = buildKnowledge(raw({ relations: withEvidence({ articleId: 'jit-post', heading: '정리' }) }), SOURCES);
    assert.ok(ambiguous.errors.some((error) => error.includes('#정리, #정리-1')));

    const resolved = buildKnowledge(raw({ relations: withEvidence({ articleId: 'jit-post', heading: '정리', anchor: '정리-1' }) }), SOURCES);
    assert.deepEqual(resolved.errors, []);
    assert.equal(resolved.data.relations[0].evidence[0].url, '/post/jit-post/#정리-1');
});

test('잘못된 참조를 각각 오류로 알린다', () => {
    const { errors } = buildKnowledge(
        raw({
            concepts: [
                { id: 'jit', name: 'JIT', category: 'jvm', description: '설명' },
                { id: 'jit', name: '중복', category: 'jvm', description: '설명' },
                { id: 'c1-compiler', name: 'C1', category: 'jvm', description: '설명' },
                { id: 'gc', name: 'GC', category: 'unknown', description: '설명' },
            ],
            relations: [
                { source: 'jit', target: 'jit', type: 'PART_OF', description: '설명', evidence: [{ articleId: 'jit-post' }] },
                { source: 'jit', target: 'nothing', type: 'PART_OF', description: '설명', evidence: [{ articleId: 'jit-post' }] },
                { source: 'jit', target: 'c1-compiler', type: 'CAUSES', description: '설명', evidence: [{ articleId: 'jit-post' }] },
                { source: 'jit', target: 'c1-compiler', type: 'PART_OF', description: '설명', evidence: [{ articleId: 'nope' }] },
                { source: 'jit', target: 'c1-compiler', type: 'PART_OF', description: '설명', evidence: [{ articleId: 'jit-post', heading: '없는 제목' }] },
            ],
            articles: { 'jit-post': ['jit', 'ghost'], 'deleted-post': ['jit'] },
        }),
        [...SOURCES, article('jit-post', '## 같은 id')],
    );
    const expected = [
        '중복 게시글 id (jit-post)',
        '중복 concept id (jit)',
        '없는 category',
        '자기 자신을 가리키는 관계',
        '없는 concept (target: nothing)',
        '알 수 없는 관계 유형 (CAUSES)',
        '없는 근거 게시글 (nope)',
        '"없는 제목" 제목이 없다',
        '없는 concept (ghost)',
        '없는 게시글 (contents/posts 에 deleted-post.mdx',
    ];
    expected.forEach((fragment) => {
        assert.ok(errors.some((error) => error.includes(fragment)), `"${fragment}" 오류가 없다\n${errors.join('\n')}`);
    });
});
