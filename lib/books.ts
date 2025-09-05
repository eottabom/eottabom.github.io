import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { serialize } from 'next-mdx-remote/serialize';

import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypePrism from 'rehype-prism-plus';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import remarkDirective from 'remark-directive';
import remarkDirectiveTransformer from './remarkDirectiveTransformer';

const BOOKS_DIR = path.join(process.cwd(), 'contents', 'books');

export type BookFrontmatter = {
    title?: string;
    date: string;
    updated?: string;
    summary?: string;
    author?: string;
    cover?: string; // "/img/books/xxx.jpg"
    [key: string]: any;
};

export type BookMeta = {
    slug: string;   // 파일명 (URL용)
    title: string;  // 표시용 (없으면 slug로)
    date: string;
    updated?: string;
    summary?: string;
    author?: string;
    cover?: string;
};

export type BookData = BookMeta & {
    mdxSource: Awaited<ReturnType<typeof serialize>>;
};

function s(v: unknown): string | undefined {
    return typeof v === 'string' && v.trim() ? v : undefined;
}

function isDir(p: string) {
    try {
        return fs.statSync(p).isDirectory();
    } catch {
        return false;
    }
}

export function getAllBookMdxFiles(dir = BOOKS_DIR): string[] {
    if (!fs.existsSync(dir)) return [];
    const entries = fs.readdirSync(dir);
    const files: string[] = [];
    for (const name of entries) {
        const full = path.join(dir, name);
        if (isDir(full)) {
            files.push(...getAllBookMdxFiles(full));
        } else if (name.endsWith('.mdx')) {
            files.push(full);
        }
    }
    return files;
}

function filenameToSlug(fullPath: string) {
    return path.basename(fullPath, '.mdx');
}

export function getBookSlugs(): string[] {
    return getAllBookMdxFiles().map(filenameToSlug);
}

export function getBookMeta(slug: string): BookMeta {
    const fullPath = path.join(BOOKS_DIR, slug + '.mdx');
    const file = fs.readFileSync(fullPath, 'utf8');
    const { data } = matter(file);

    const title = s((data as BookFrontmatter).title) ?? slug;

    return {
        slug,
        title,
        date: String((data as BookFrontmatter).date),
        ...(s((data as BookFrontmatter).updated) ? { updated: s((data as BookFrontmatter).updated) } : {}),
        ...(s((data as BookFrontmatter).summary) ? { summary: s((data as BookFrontmatter).summary) } : {}),
        ...(s((data as BookFrontmatter).author)  ? { author: s((data as BookFrontmatter).author) }  : {}),
        ...(s((data as BookFrontmatter).cover)   ? { cover: s((data as BookFrontmatter).cover) }    : {}),
    };
}

export function getBooksMetaOnly(): BookMeta[] {
    const slugs = getBookSlugs();
    const list = slugs.map(getBookMeta);
    return list.sort((a, b) => {
        const ad = Date.parse(a.updated ?? a.date) || 0;
        const bd = Date.parse(b.updated ?? b.date) || 0;
        return bd - ad; // 최신 업데이트/작성 순
    });
}

export async function getBookData(slug: string): Promise<BookData> {
    const all = getAllBookMdxFiles();
    const matchPath = all.find((fp) => filenameToSlug(fp) === slug);
    if (!matchPath) throw new Error(`[books] Not found: ${slug}`);

    const file = fs.readFileSync(matchPath, 'utf8');
    const { content, data } = matter(file);

    const mdxSource = await serialize(content, {
        mdxOptions: {
            remarkPlugins: [remarkDirective, remarkDirectiveTransformer, remarkGfm],
            rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings, rehypePrism],
            format: 'mdx',
        },
        scope: data,
    });

    const fm = data as BookFrontmatter;
    const title = s(fm.title) ?? slug;

    const base: BookMeta = {
        slug,
        title,
        date: String(fm.date),
        ...(s(fm.updated) ? { updated: s(fm.updated) } : {}),
        ...(s(fm.summary) ? { summary: s(fm.summary) } : {}),
        ...(s(fm.author)  ? { author: s(fm.author) }  : {}),
        ...(s(fm.cover)   ? { cover: s(fm.cover) }    : {}),
    };

    return {
        ...base,
        mdxSource,
    };
}

export function getBookSource(slug: string): { content: string; data: any } {
    const all = getAllBookMdxFiles();
    const matchPath = all.find((fp) => filenameToSlug(fp) === slug);
    if (!matchPath) throw new Error(`[books] Not found: ${slug}`);

    const file = fs.readFileSync(matchPath, 'utf8');
    const { content, data } = matter(file);
    return { content, data };
}
