import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { extractIdFromFilename, getAllMdxFiles } from '../lib/posts';
import {
    DEFAULT_GEMMA_MODEL,
    DEFAULT_GEMMA_URL,
    DEFAULT_MAX_CONCEPTS,
    DEFAULT_MAX_TOKENS,
    DEFAULT_TEMPERATURE,
    DEFAULT_TIMEOUT_MS,
    checkGemmaHealth,
    classifyArticleWithGemma,
    formatReviewMarkdown,
    isMergePolicy,
    mergeArticleConcepts,
    serializeArticlesJson,
    validateProposedConcepts,
} from '../lib/knowledge/classify';
import type { ClassifyArticleInput, MergePolicy } from '../lib/knowledge/classify';
import { loadKnowledgeResult } from '../lib/knowledge/load';
import type { Concept } from '../lib/knowledge/types';

interface CliOptions {
    articleId: string;
    isApply: boolean;
    mergePolicy: MergePolicy;
    maxConcepts: number;
    isStrict: boolean;
    reportPath: string | null;
    jsonOutPath: string | null;
    isHelp: boolean;
}

const KNOWLEDGE_DIR = path.join(process.cwd(), 'knowledge');
const ARTICLES_JSON_PATH = path.join(KNOWLEDGE_DIR, 'articles.json');

const printUsage = (): void => {
    console.log([
        '사용법: npm run classify:knowledge -- --article <게시글-id> [옵션]',
        '',
        '옵션',
        '  --article <id>           분류할 게시글 ID (필수, contents/posts/**/<id>.mdx)',
        '  --dry-run                파일을 수정하지 않고 제안 결과만 출력 (기본값)',
        '  --apply                  knowledge/articles.json 에 결과 반영 후 check:knowledge 실행',
        '  --merge <append|replace> 기존 매핑 병합 방식 (기본값: append)',
        `  --max-concepts <n>       최대 추천 개념 수 (기본값: ${DEFAULT_MAX_CONCEPTS})`,
        '  --allow-invalid          모델이 제안한 미존재 또는 중복 ID 를 무시하고 계속 진행',
        '  --report <path>          검토용 마크다운 리포트 저장 경로',
        '  --json-out <path>        실행 결과 JSON 저장 경로',
        '  --help                   도움말 출력',
        '',
        '환경 변수',
        `  GEMMA_URL                OpenAI 호환 API 기본 URL (기본값: ${DEFAULT_GEMMA_URL})`,
        `  GEMMA_MODEL              모델 ID (기본값: ${DEFAULT_GEMMA_MODEL})`,
        `  GEMMA_TEMPERATURE        생성 온도 (기본값: ${DEFAULT_TEMPERATURE})`,
        `  GEMMA_MAX_TOKENS         최대 출력 토큰 수 (기본값: ${DEFAULT_MAX_TOKENS})`,
        `  GEMMA_TIMEOUT_MS         요청 타임아웃 ms (기본값: ${DEFAULT_TIMEOUT_MS})`,
    ].join('\n'));
};

const parseNumberEnv = (raw: string | undefined, fallback: number): number => {
    if (raw === undefined || raw.trim() === '') {
        return fallback;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
        return fallback;
    }
    return parsed;
};

const parseArgs = (argv: readonly string[]): CliOptions => {
    let articleId = '';
    let isApply = false;
    let mergePolicy: MergePolicy = 'append';
    let maxConcepts = DEFAULT_MAX_CONCEPTS;
    let isStrict = true;
    let reportPath: string | null = null;
    let jsonOutPath: string | null = null;
    let isHelp = false;

    const nextValue = (index: number, flag: string): string => {
        const value = argv[index + 1];
        if (value === undefined || value.startsWith('--')) {
            throw new Error(`${flag} 옵션 값이 필요하다`);
        }
        return value;
    };

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === '--help' || arg === '-h') {
            isHelp = true;
            continue;
        }
        if (arg === '--article') {
            articleId = nextValue(index, arg).trim();
            index += 1;
            continue;
        }
        if (arg === '--dry-run') {
            isApply = false;
            continue;
        }
        if (arg === '--apply') {
            isApply = true;
            continue;
        }
        if (arg === '--merge') {
            const rawPolicy = nextValue(index, arg).trim();
            if (!isMergePolicy(rawPolicy)) {
                throw new Error(`--merge 값은 append 또는 replace 여야 한다: ${rawPolicy}`);
            }
            mergePolicy = rawPolicy;
            index += 1;
            continue;
        }
        if (arg === '--max-concepts') {
            const rawCount = Number(nextValue(index, arg));
            if (!Number.isInteger(rawCount) || rawCount < 1 || rawCount > 20) {
                throw new Error('--max-concepts 는 1 이상 20 이하의 정수여야 한다');
            }
            maxConcepts = rawCount;
            index += 1;
            continue;
        }
        if (arg === '--allow-invalid') {
            isStrict = false;
            continue;
        }
        if (arg === '--strict') {
            isStrict = true;
            continue;
        }
        if (arg === '--report') {
            reportPath = nextValue(index, arg);
            index += 1;
            continue;
        }
        if (arg === '--json-out') {
            jsonOutPath = nextValue(index, arg);
            index += 1;
            continue;
        }
        throw new Error(`알 수 없는 옵션: ${arg}`);
    }

    return { articleId, isApply, mergePolicy, maxConcepts, isStrict, reportPath, jsonOutPath, isHelp };
};

const readTargetArticle = (articleId: string): ClassifyArticleInput => {
    const matchedPath = getAllMdxFiles().find((fullPath) => extractIdFromFilename(fullPath) === articleId);
    if (!matchedPath) {
        throw new Error(`게시글을 찾지 못했다: contents/posts/**/${articleId}.mdx`);
    }

    const { content, data } = matter(fs.readFileSync(matchedPath, 'utf8'));
    const title = typeof data.title === 'string' && data.title.trim() !== '' ? data.title.trim() : articleId;
    const summary = typeof data.summary === 'string' && data.summary.trim() !== '' ? data.summary.trim() : null;
    const description = typeof data.description === 'string' && data.description.trim() !== ''
        ? data.description.trim()
        : null;
    const tags = Array.isArray(data.tags)
        ? data.tags.filter((tag): tag is string => typeof tag === 'string')
        : [];

    return { id: articleId, title, summary, description, tags, content };
};

const readRawArticlesJson = (): Record<string, string[]> => {
    const raw = JSON.parse(fs.readFileSync(ARTICLES_JSON_PATH, 'utf8')) as unknown;
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
        throw new Error('knowledge/articles.json 형식이 올바른 객체가 아니다');
    }
    const result: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(raw)) {
        if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
            throw new Error(`knowledge/articles.json["${key}"] 이 문자열 배열이 아니다`);
        }
        result[key] = value;
    }
    return result;
};

const writeFileEnsuringDir = (filePath: string, content: string): void => {
    fs.mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
};

const run = async (): Promise<void> => {
    const options = parseArgs(process.argv.slice(2));
    if (options.isHelp) {
        printUsage();
        return;
    }
    if (options.articleId === '') {
        printUsage();
        throw new Error('--article <게시글-id> 옵션이 필요하다');
    }

    const baseKnowledge = loadKnowledgeResult();
    if (baseKnowledge.errors.length > 0) {
        throw new Error(`기존 knowledge 데이터가 유효하지 않다:\n${baseKnowledge.errors.join('\n')}`);
    }

    const concepts: readonly Concept[] = baseKnowledge.data.concepts;
    const conceptsById = new Map(concepts.map((concept) => [concept.id, concept]));
    const validConceptIds = new Set(concepts.map((concept) => concept.id));

    const article = readTargetArticle(options.articleId);
    const currentArticles = readRawArticlesJson();

    const gemmaUrl = process.env.GEMMA_URL?.trim() || DEFAULT_GEMMA_URL;
    const gemmaModel = process.env.GEMMA_MODEL?.trim() || DEFAULT_GEMMA_MODEL;
    const temperature = parseNumberEnv(process.env.GEMMA_TEMPERATURE, DEFAULT_TEMPERATURE);
    const maxTokens = parseNumberEnv(process.env.GEMMA_MAX_TOKENS, DEFAULT_MAX_TOKENS);
    const timeoutMs = parseNumberEnv(process.env.GEMMA_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);

    const health = await checkGemmaHealth(gemmaUrl);
    if (!health.isHealthy) {
        throw new Error(`Gemma 서버에 연결할 수 없다 (${gemmaUrl}): ${health.error ?? '알 수 없는 오류'}`);
    }

    console.log(`[classify] 대상 글: ${article.id} (${article.title})`);
    console.log(`[classify] 모델: ${gemmaModel} (${gemmaUrl}), 병합: ${options.mergePolicy}, 모드: ${options.isApply ? 'apply' : 'dry-run'}`);

    const startedAt = Date.now();
    const { parsed, usage, attempts } = await classifyArticleWithGemma({
        concepts,
        article,
        maxConcepts: options.maxConcepts,
        url: gemmaUrl,
        model: gemmaModel,
        temperature,
        maxTokens,
        timeoutMs,
        onProgress: (message) => console.log(`[classify] ${message}`),
    });
    const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log(
        `[classify] 추론 완료 (${elapsedSec}초, 시도 ${attempts}회, ` +
            `입력 ${usage?.promptTokens ?? '-'}토큰, 캐시 ${usage?.cachedTokens ?? '-'}토큰, 출력 ${usage?.completionTokens ?? '-'}토큰)`,
    );

    const validation = validateProposedConcepts({
        proposed: parsed.concepts,
        validConceptIds,
        maxConcepts: options.maxConcepts,
    });

    const merge = mergeArticleConcepts({
        articles: currentArticles,
        articleId: article.id,
        proposedIds: validation.validConcepts.map((item) => item.id),
        policy: options.mergePolicy,
    });

    const hasInvalidOrDuplicate = validation.invalidIds.length > 0 || validation.duplicateIds.length > 0;
    const shouldWriteFile = options.isApply && merge.status === 'updated' && (!options.isStrict || !hasInvalidOrDuplicate);

    let checkErrors: string[] = [];
    if (shouldWriteFile) {
        const serialized = serializeArticlesJson(merge.nextArticles);
        fs.writeFileSync(ARTICLES_JSON_PATH, serialized, 'utf8');
        const verification = loadKnowledgeResult();
        checkErrors = verification.errors;
    }

    const report = formatReviewMarkdown({
        article,
        conceptsById,
        mergePolicy: options.mergePolicy,
        validation,
        merge,
        notes: parsed.notes,
        model: gemmaModel,
        isDryRun: !options.isApply,
        checkErrors,
    });

    if (options.reportPath !== null) {
        writeFileEnsuringDir(options.reportPath, report);
    }

    const resultPayload = {
        articleId: article.id,
        articleTitle: article.title,
        model: gemmaModel,
        mergePolicy: options.mergePolicy,
        isApply: options.isApply,
        status: merge.status,
        hasWrittenFile: shouldWriteFile,
        previousIds: merge.previousIds,
        proposedIds: merge.proposedIds,
        finalIds: merge.finalIds,
        addedIds: merge.addedIds,
        removedIds: merge.removedIds,
        keptIds: merge.keptIds,
        invalidIds: validation.invalidIds,
        duplicateIds: validation.duplicateIds,
        notes: parsed.notes,
        checkErrors,
    };

    if (options.jsonOutPath !== null) {
        writeFileEnsuringDir(options.jsonOutPath, `${JSON.stringify(resultPayload, null, 2)}\n`);
    }

    console.log('');
    console.log(report);

    if (options.isStrict && hasInvalidOrDuplicate) {
        const details = [
            validation.invalidIds.length > 0 ? `존재하지 않는 ID: ${validation.invalidIds.join(', ')}` : '',
            validation.duplicateIds.length > 0 ? `중복 ID: ${validation.duplicateIds.join(', ')}` : '',
        ].filter(Boolean).join(' / ');
        throw new Error(`엄격 검증 실패 (${details})`);
    }

    if (checkErrors.length > 0) {
        throw new Error(`check:knowledge 검증 실패 (${checkErrors.length}건)`);
    }
};

run().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[error] ${message}`);
    process.exit(1);
});
