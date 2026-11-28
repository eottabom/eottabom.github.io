import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { extractIdFromFilename, getAllMdxFiles } from '../posts';
import { buildKnowledge } from './build';
import type { ArticleSource, KnowledgeResult } from './build';
import type { KnowledgeData } from './types';

// 파일을 읽어 buildKnowledge 에 넘긴다. fs 를 쓰므로 getStaticProps 와 스크립트에서만 import 한다.

const KNOWLEDGE_DIRECTORY = path.join(process.cwd(), 'knowledge');

const readJson = (fileName: string): unknown => {
    const filePath = path.join(KNOWLEDGE_DIRECTORY, fileName);
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        throw new Error(`knowledge/${fileName} 을 읽지 못했다: ${(error as Error).message}`);
    }
};

const readArticleSources = (): ArticleSource[] => {
    return getAllMdxFiles().map((fullPath) => {
        const { content, data } = matter(fs.readFileSync(fullPath, 'utf8'));
        return {
            id: extractIdFromFilename(fullPath),
            filePath: path.relative(process.cwd(), fullPath),
            frontmatter: data,
            content,
        };
    });
};

export const loadKnowledgeResult = (): KnowledgeResult => {
    return buildKnowledge(
        {
            categories: readJson('categories.json'),
            concepts: readJson('concepts.json'),
            relations: readJson('relations.json'),
            articles: readJson('articles.json'),
        },
        readArticleSources(),
    );
};

// 게시글 페이지마다 불리므로 빌드에서는 한 번만 읽는다. 개발 서버에서는 JSON 수정을 바로 보도록 매번 읽는다.
let cachedResult: KnowledgeResult | null = null;

// 검증에 실패하면 예외를 던져 next build 를 멈춘다.
export const loadKnowledge = (): KnowledgeData => {
    const result = process.env.NODE_ENV === 'production' && cachedResult ? cachedResult : loadKnowledgeResult();
    cachedResult = result;
    const { data, errors } = result;
    if (errors.length > 0) {
        throw new Error(`knowledge 데이터 검증 실패 (${errors.length}건)\n${errors.map((error) => `  - ${error}`).join('\n')}`);
    }
    return data;
};
