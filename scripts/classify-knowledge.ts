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
    formatBatchReviewMarkdown,
    isMergePolicy,
    mergeArticleConcepts,
    resolveTargetArticleIds,
    serializeArticlesJson,
    validateProposedConcepts,
} from '../lib/knowledge/classify';
import type {
    ArticleCatalogEntry,
    BatchArticleReportItem,
    ClassifyArticleInput,
    MergePolicy,
    TargetMode,
} from '../lib/knowledge/classify';
import { loadKnowledgeResult } from '../lib/knowledge/load';
import type { Concept } from '../lib/knowledge/types';

interface CliOptions {
    mode: TargetMode;
    explicitIds: string[];
    limit: number | null;
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
        '사용법: npm run classify:knowledge -- [대상 옵션] [실행 옵션]',
        '',
        '대상 옵션 (미지정 시 오류)',
        '  --article <id>           분류할 게시글 ID (반복 지정 또는 쉼표 구분 가능)',
        '  --articles <id1,id2>     분류할 게시글 ID 목록 (쉼표 구분)',
        '  --latest                 가장 최근 발행 또는 수정된 글 1편 자동 선택',
        '  --unmapped               knowledge/articles.json 에 없는 미분류 글 전체 선택',
        '  --all                    전체 블로그 글 재분류',
        '  --limit <n>              일괄 실행 시 최대 처리 글 수 제한',
        '',
        '실행 옵션',
        '  --dry-run                파일을 수정하지 않고 제안 결과만 출력 (기본값)',
        '  --apply                  knowledge/articles.json 에 결과 반영 후 check:knowledge 실행',
        '  --merge <append|replace> 기존 매핑 병합 방식 (기본값: append)',
        `  --max-concepts <n>       최대 추천 개념 수 (기본값: ${DEFAULT_MAX_CONCEPTS})`,
        '  --allow-invalid          모델이 제안한 미존재 또는 중복 ID 를 제외하고 계속 진행',
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

const splitArticleIds = (raw: string): string[] => {
    return raw
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id !== '');
};

const parseArgs = (argv: readonly string[]): CliOptions => {
    let mode: TargetMode = 'article';
    const explicitIds: string[] = [];
    let limit: number | null = null;
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
        if (arg === '--article' || arg === '--articles') {
            explicitIds.push(...splitArticleIds(nextValue(index, arg)));
            index += 1;
            continue;
        }
        if (arg === '--latest') {
            mode = 'latest';
            continue;
        }
        if (arg === '--unmapped') {
            mode = 'unmapped';
            continue;
        }
        if (arg === '--all') {
            mode = 'all';
            continue;
        }
        if (arg === '--limit') {
            const rawLimit = Number(nextValue(index, arg));
            if (!Number.isInteger(rawLimit) || rawLimit < 1) {
                throw new Error('--limit 는 1 이상의 정수여야 한다');
            }
            limit = rawLimit;
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

    return { mode, explicitIds, limit, isApply, mergePolicy, maxConcepts, isStrict, reportPath, jsonOutPath, isHelp };
};

const toDateString = (value: unknown): string | null => {
    if (value instanceof Date) {
        return value.toISOString().slice(0, 10);
    }
    if (typeof value === 'string' && value.trim() !== '') {
        return value.trim();
    }
    return null;
};

const loadAllArticleInputs = (): { catalog: ArticleCatalogEntry[]; byId: Map<string, ClassifyArticleInput> } => {
    const catalog: ArticleCatalogEntry[] = [];
    const byId = new Map<string, ClassifyArticleInput>();

    for (const fullPath of getAllMdxFiles()) {
        const id = extractIdFromFilename(fullPath);
        const { content, data } = matter(fs.readFileSync(fullPath, 'utf8'));
        const title = typeof data.title === 'string' && data.title.trim() !== '' ? data.title.trim() : id;
        const summary = typeof data.summary === 'string' && data.summary.trim() !== '' ? data.summary.trim() : null;
        const description = typeof data.description === 'string' && data.description.trim() !== ''
            ? data.description.trim()
            : null;
        const tags = Array.isArray(data.tags)
            ? data.tags.filter((tag): tag is string => typeof tag === 'string')
            : [];
        const date = toDateString(data.date) ?? '';
        const updated = toDateString(data.updated);

        catalog.push({ id, title, date, updated });
        byId.set(id, { id, title, summary, description, tags, content });
    }

    return { catalog, byId };
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

const describeTargetLabel = (options: CliOptions, targetIds: readonly string[]): string => {
    if (options.explicitIds.length > 0) {
        return targetIds.length === 1 ? targetIds[0] : `지정 게시글 ${targetIds.length}편`;
    }
    if (options.mode === 'latest') {
        return targetIds.length === 1 ? `최근 글 (${targetIds[0]})` : '최근 글';
    }
    if (options.mode === 'unmapped') {
        return '미분류 글';
    }
    return '전체 블로그 글 재분류';
};

const run = async (): Promise<void> => {
    const options = parseArgs(process.argv.slice(2));
    if (options.isHelp) {
        printUsage();
        return;
    }

    const baseKnowledge = loadKnowledgeResult();
    if (baseKnowledge.errors.length > 0) {
        throw new Error(`기존 knowledge 데이터가 유효하지 않다:\n${baseKnowledge.errors.join('\n')}`);
    }

    const concepts: readonly Concept[] = baseKnowledge.data.concepts;
    const conceptsById = new Map(concepts.map((concept) => [concept.id, concept]));
    const validConceptIds = new Set(concepts.map((concept) => concept.id));

    const { catalog, byId } = loadAllArticleInputs();
    const initialArticles = readRawArticlesJson();
    const mappedArticleIds = new Set(Object.keys(initialArticles));

    const targetIds = resolveTargetArticleIds({
        mode: options.mode,
        explicitIds: options.explicitIds,
        allArticles: catalog,
        mappedArticleIds,
        limit: options.limit,
    });

    const gemmaUrl = process.env.GEMMA_URL?.trim() || DEFAULT_GEMMA_URL;
    const gemmaModel = process.env.GEMMA_MODEL?.trim() || DEFAULT_GEMMA_MODEL;
    const temperature = parseNumberEnv(process.env.GEMMA_TEMPERATURE, DEFAULT_TEMPERATURE);
    const maxTokens = parseNumberEnv(process.env.GEMMA_MAX_TOKENS, DEFAULT_MAX_TOKENS);
    const timeoutMs = parseNumberEnv(process.env.GEMMA_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);
    const targetLabel = describeTargetLabel(options, targetIds);

    if (targetIds.length === 0) {
        const emptyReport = formatBatchReviewMarkdown({
            items: [],
            conceptsById,
            mergePolicy: options.mergePolicy,
            model: gemmaModel,
            isDryRun: !options.isApply,
            checkErrors: [],
            targetLabel,
        });
        if (options.reportPath !== null) {
            writeFileEnsuringDir(options.reportPath, emptyReport);
        }
        if (options.jsonOutPath !== null) {
            writeFileEnsuringDir(
                options.jsonOutPath,
                `${JSON.stringify({
                    mode: options.mode,
                    targetLabel,
                    targetIds: [],
                    updatedIds: [],
                    unchangedIds: [],
                    noMatchIds: [],
                    failedIds: [],
                    hasWrittenFile: false,
                    status: 'unchanged',
                    checkErrors: [],
                }, null, 2)}\n`,
            );
        }
        console.log(`[classify] 처리할 대상 글이 없다 (${targetLabel})`);
        return;
    }

    const health = await checkGemmaHealth(gemmaUrl);
    if (!health.isHealthy) {
        throw new Error(`Gemma 서버에 연결할 수 없다 (${gemmaUrl}): ${health.error ?? '알 수 없는 오류'}`);
    }

    console.log(
        `[classify] 대상: ${targetLabel} (${targetIds.length}편), ` +
            `모델: ${gemmaModel}, 병합: ${options.mergePolicy}, 모드: ${options.isApply ? 'apply' : 'dry-run'}`,
    );

    let workingArticles: Record<string, string[]> = { ...initialArticles };
    const reportItems: BatchArticleReportItem[] = [];
    const updatedIds: string[] = [];
    const unchangedIds: string[] = [];
    const noMatchIds: string[] = [];
    const failedIds: string[] = [];
    const strictFailures: string[] = [];

    for (let index = 0; index < targetIds.length; index += 1) {
        const articleId = targetIds[index];
        const article = byId.get(articleId);
        if (!article) {
            failedIds.push(articleId);
            continue;
        }

        console.log(`[classify] [${index + 1}/${targetIds.length}] ${article.id} (${article.title})`);
        const startedAt = Date.now();

        try {
            const { parsed, usage, attempts } = await classifyArticleWithGemma({
                concepts,
                article,
                maxConcepts: options.maxConcepts,
                url: gemmaUrl,
                model: gemmaModel,
                temperature,
                maxTokens,
                timeoutMs,
                onProgress: (message) => console.log(`[classify] [${index + 1}/${targetIds.length}] ${message}`),
            });
            const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);
            console.log(
                `[classify] [${index + 1}/${targetIds.length}] 완료 (${elapsedSec}초, 시도 ${attempts}회, ` +
                    `입력 ${usage?.promptTokens ?? '-'}토큰, 캐시 ${usage?.cachedTokens ?? '-'}토큰, 출력 ${usage?.completionTokens ?? '-'}토큰)`,
            );

            const validation = validateProposedConcepts({
                proposed: parsed.concepts,
                validConceptIds,
                maxConcepts: options.maxConcepts,
            });
            const hasInvalidOrDuplicate = validation.invalidIds.length > 0 || validation.duplicateIds.length > 0;

            if (options.isStrict && hasInvalidOrDuplicate) {
                const details = [
                    validation.invalidIds.length > 0 ? `존재하지 않는 ID: ${validation.invalidIds.join(', ')}` : '',
                    validation.duplicateIds.length > 0 ? `중복 ID: ${validation.duplicateIds.join(', ')}` : '',
                ].filter(Boolean).join(' / ');
                strictFailures.push(`${article.id} (${details})`);
                failedIds.push(article.id);
                reportItems.push({
                    article,
                    merge: null,
                    validation,
                    notes: parsed.notes,
                    error: `엄격 검증 실패 (${details})`,
                });
                continue;
            }

            const merge = mergeArticleConcepts({
                articles: workingArticles,
                articleId: article.id,
                proposedIds: validation.validConcepts.map((item) => item.id),
                policy: options.mergePolicy,
            });

            if (merge.status === 'updated') {
                workingArticles = merge.nextArticles;
                updatedIds.push(article.id);
            } else if (merge.status === 'unchanged') {
                unchangedIds.push(article.id);
            } else {
                noMatchIds.push(article.id);
            }

            reportItems.push({
                article,
                merge,
                validation,
                notes: parsed.notes,
                error: null,
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            console.error(`[classify] [${index + 1}/${targetIds.length}] 실패: ${message}`);
            failedIds.push(article.id);
            reportItems.push({
                article,
                merge: null,
                validation: null,
                notes: null,
                error: message,
            });
        }
    }

    const shouldWriteFile = options.isApply && updatedIds.length > 0 && !(targetIds.length === 1 && strictFailures.length > 0);
    let checkErrors: string[] = [];

    if (shouldWriteFile) {
        const serialized = serializeArticlesJson(workingArticles);
        fs.writeFileSync(ARTICLES_JSON_PATH, serialized, 'utf8');
        const verification = loadKnowledgeResult();
        checkErrors = verification.errors;
    }

    const report = formatBatchReviewMarkdown({
        items: reportItems,
        conceptsById,
        mergePolicy: options.mergePolicy,
        model: gemmaModel,
        isDryRun: !options.isApply,
        checkErrors,
        targetLabel,
    });

    if (options.reportPath !== null) {
        writeFileEnsuringDir(options.reportPath, report);
    }

    const overallStatus = updatedIds.length > 0
        ? 'updated'
        : noMatchIds.length > 0 && unchangedIds.length === 0
            ? 'no_match'
            : 'unchanged';

    const resultPayload = {
        mode: options.mode,
        targetLabel,
        model: gemmaModel,
        mergePolicy: options.mergePolicy,
        isApply: options.isApply,
        status: overallStatus,
        hasWrittenFile: shouldWriteFile,
        targetIds,
        updatedIds,
        unchangedIds,
        noMatchIds,
        failedIds,
        articleId: targetIds.length === 1 ? targetIds[0] : '',
        articleTitle: targetIds.length === 1 ? (byId.get(targetIds[0])?.title ?? targetIds[0]) : targetLabel,
        checkErrors,
    };

    if (options.jsonOutPath !== null) {
        writeFileEnsuringDir(options.jsonOutPath, `${JSON.stringify(resultPayload, null, 2)}\n`);
    }

    console.log('');
    console.log(report);

    if (checkErrors.length > 0) {
        throw new Error(`check:knowledge 검증 실패 (${checkErrors.length}건)`);
    }

    // 단일 글 실행에서는 엄격 검증 실패나 추론 오류 시 즉시 실패로 종료한다.
    // 다건 일괄 실행에서는 전부 실패한 경우만 실패로 종료하고, 부분 성공은 리포트와 함께 검토 가능하게 남긴다.
    if (targetIds.length === 1 && failedIds.length > 0) {
        throw new Error(reportItems[0]?.error ?? '분류 실패');
    }
    if (targetIds.length > 1 && failedIds.length === targetIds.length) {
        throw new Error(`대상 글 ${targetIds.length}편 모두 분류에 실패했다`);
    }
};

run().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[error] ${message}`);
    process.exit(1);
});
