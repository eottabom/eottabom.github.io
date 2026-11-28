import GithubSlugger from 'github-slugger';

// MDX 본문에서 Heading 과 내부 링크를 뽑는다. 파일 시스템에 접근하지 않는 순수 함수만 둔다.

const CODE_FENCE_PATTERN = /^\s*(`{3,}|~{3,})/;
const HEADING_PATTERN = /^(#{1,6})\s+(.+?)\s*#*\s*$/;
const INLINE_CODE_PATTERN = /`+([^`]*?)`+/g;
const MARKDOWN_IMAGE_PATTERN = /!\[([^\]]*)\]\([^)]*\)/g;
const MARKDOWN_LINK_PATTERN = /\[([^\]]*)\]\([^)]*\)/g;
const HTML_TAG_PATTERN = /<[^>]+>/g;
const STAR_EMPHASIS_PATTERN = /(\*\*|\*|~~)(.+?)\1/g;
// 단어 안의 밑줄(oom_score_adj)은 강조가 아니다.
const UNDERSCORE_EMPHASIS_PATTERN = /(?<![\p{L}\p{N}])(__|_)(.+?)\1(?![\p{L}\p{N}])/gu;
// remark-directive 는 백틱 밖의 :name 을 텍스트 디렉티브로 읽어 렌더링에서 지운다 (-XX:MaxRAMPercentage 의 :MaxRAMPercentage).
const TEXT_DIRECTIVE_PATTERN = /:[A-Za-z][\w-]*(\[[^\]]*\])?(\{[^}]*\})?/g;
const ESCAPE_PATTERN = /\\([\\`*_{}[\]()#+\-.!~|<>:])/g;
const INLINE_CODE_SPLIT_PATTERN = /(`+[^`]*?`+)/;
const INTERNAL_LINK_PATTERNS = [/\]\(\s*\/post\/([^)\s#?]+)/g, /href=\{?["'`]\/post\/([^"'`#?]+)/g];

export interface Heading {
    depth: number;
    text: string;
    anchor: string;
}

// 코드 블록 안의 줄을 빈 줄로 바꾼다. 줄 수는 그대로 둔다.
export const blankCodeBlocks = (content: string): string[] => {
    let fence: string | null = null;
    return content.split('\n').map((line) => {
        const match = line.match(CODE_FENCE_PATTERN);
        if (fence === null) {
            if (match) {
                fence = match[1];
                return '';
            }
            return line;
        }
        if (match && match[1][0] === fence[0] && match[1].length >= fence.length) {
            fence = null;
        }
        return '';
    });
};

// rehype-slug 는 렌더링된 제목의 텍스트로 앵커를 만들기 때문에, 마크다운 문법을 걷어낸 텍스트를 쓴다.
// 인라인 코드 안은 글자 그대로 두고, 바깥만 마크다운 문법을 걷어낸다.
export const toHeadingText = (raw: string): string => {
    return raw
        .split(INLINE_CODE_SPLIT_PATTERN)
        .map((part, index) => {
            if (index % 2 === 1) {
                return part.replace(INLINE_CODE_PATTERN, '$1');
            }
            return part
                .replace(MARKDOWN_IMAGE_PATTERN, '$1')
                .replace(MARKDOWN_LINK_PATTERN, '$1')
                .replace(HTML_TAG_PATTERN, '')
                .replace(TEXT_DIRECTIVE_PATTERN, '')
                .replace(STAR_EMPHASIS_PATTERN, '$2')
                .replace(UNDERSCORE_EMPHASIS_PATTERN, '$2')
                .replace(ESCAPE_PATTERN, '$1');
        })
        .join('')
        .trim();
};

// rehype-slug 와 같은 github-slugger 로, 문서 순서대로 앵커를 만든다. 같은 제목이 다시 나오면 -1, -2 가 붙는다.
export const extractHeadings = (content: string): Heading[] => {
    const slugger = new GithubSlugger();
    const headings: Heading[] = [];
    for (const line of blankCodeBlocks(content)) {
        const match = line.match(HEADING_PATTERN);
        if (!match) {
            continue;
        }
        const text = toHeadingText(match[2]);
        headings.push({ depth: match[1].length, text, anchor: slugger.slug(text) });
    }
    return headings;
};

// 본문의 /post/<id> 링크를 등장 순서대로, 중복 없이 뽑는다. 코드 블록과 인라인 코드 안의 문자열은 제외한다.
export const extractInternalLinks = (content: string): string[] => {
    const text = blankCodeBlocks(content)
        .map((line) => line.replace(INLINE_CODE_PATTERN, ''))
        .join('\n');
    const found = new Map<number, string>();
    for (const pattern of INTERNAL_LINK_PATTERNS) {
        for (const match of text.matchAll(pattern)) {
            found.set(match.index ?? 0, match[1].replace(/\/+$/, ''));
        }
    }
    const ordered = [...found.entries()].sort(([a], [b]) => a - b).map(([, id]) => id);
    return [...new Set(ordered)];
};
