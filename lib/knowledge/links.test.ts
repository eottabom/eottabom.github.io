import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractHeadings, extractInternalLinks, toHeadingText } from './links';

test('같은 제목이 다시 나오면 rehype-slug 처럼 -1 을 붙인다', () => {
    const headings = extractHeadings(['## 정리', '### 1) 클래스 로딩', '## 정리'].join('\n'));
    assert.deepEqual(
        headings.map((heading) => heading.anchor),
        ['정리', '1-클래스-로딩', '정리-1'],
    );
});

test('코드 블록 안의 # 줄은 제목으로 보지 않는다', () => {
    const content = ['## 실제 제목', '```bash', '# 주석', '```', '~~~', '## 코드 안', '~~~'].join('\n');
    assert.deepEqual(
        extractHeadings(content).map((heading) => heading.text),
        ['실제 제목'],
    );
});

test('제목의 마크다운 문법은 렌더링된 텍스트 기준으로 걷어낸다', () => {
    assert.equal(toHeadingText('3) 아래와 같이, `claude_desktop_config.json` 을 열어주고,'), '3) 아래와 같이, claude_desktop_config.json 을 열어주고,');
    assert.equal(toHeadingText('Pod Qos 에 따른 oom_score_adj 값'), 'Pod Qos 에 따른 oom_score_adj 값');
    assert.equal(toHeadingText('**굵게** 와 [링크](https://example.com)'), '굵게 와 링크');
    assert.equal(toHeadingText('use -XX:InitialRAMPercentage / -XX:MaxRAMPercentage'), 'use -XX / -XX');
});

test('내부 링크는 등장 순서대로 중복 없이 뽑고, 코드 안의 링크는 제외한다', () => {
    const content = [
        '[Probe](/post/kubernetes-probes) 와 [JIT](/post/jvm-jit/#tier) 를 본다.',
        '`[예시](/post/inline-code)` 는 코드다.',
        '```md',
        '[블록](/post/code-block)',
        '```',
        '<a href="/post/html-link/">링크</a> 와 다시 [Probe](/post/kubernetes-probes/)',
    ].join('\n');
    assert.deepEqual(extractInternalLinks(content), ['kubernetes-probes', 'jvm-jit', 'html-link']);
});
