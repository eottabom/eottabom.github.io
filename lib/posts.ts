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

const postsDirectory = path.join(process.cwd(), 'posts');

type PostFrontmatter = {
  title: string;
  date: string;
  tags?: string[];
  summary?: string;
  description?: string;
  [key: string]: any;
};

type PostData = PostFrontmatter & {
  id: string;
  mdxSource: Awaited<ReturnType<typeof serialize>>;
};

export function getAllMdxFiles(dirPath = postsDirectory): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dirPath);
  list.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllMdxFiles(filePath));
    } else if (file.endsWith('.mdx')) {
      results.push(filePath);
    }
  });
  return results;
}

function extractIdFromFilename(fullPath: string): string {
  return path.basename(fullPath, '.mdx');
}

export function getAllPostIds(): { params: { id: string } }[] {
  const allFiles = getAllMdxFiles();
  return allFiles.map((fullPath) => ({
    params: {
      id: extractIdFromFilename(fullPath),
    },
  }));
}

export async function getPostData(id: string): Promise<PostData> {
  const allFiles = getAllMdxFiles();
  const matchPath = allFiles.find((fp) => path.basename(fp, '.mdx') === id);
  if (!matchPath) throw new Error(`Post not found: ${id}`);

  const fileContents = fs.readFileSync(matchPath, 'utf8');
  const { content, data } = matter(fileContents);

  const mdxSource = await serialize(content, {
    mdxOptions: {
      remarkPlugins: [remarkGfm, remarkDirective, remarkDirectiveTransformer],
      rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings, rehypePrism],
    },
    scope: data,
  });

  return {
    id,
    mdxSource,
    ...(data as PostFrontmatter),
  };
}

export async function getSortedPostsDataWithContent(): Promise<PostData[]> {
  const allFiles = getAllMdxFiles();

  const allPostsData: PostData[] = await Promise.all(
    allFiles.map(async (fullPath) => {
      const id = extractIdFromFilename(fullPath);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { content, data } = matter(fileContents);
      const mdxSource = await serialize(content, {
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings],
          format: 'mdx',
        },
        scope: data,
      });

      return {
        id,
        mdxSource,
        ...(data as PostFrontmatter),
      };
    })
  );

  return allPostsData.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
