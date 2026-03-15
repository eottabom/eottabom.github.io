import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const BASE_URL = 'https://eottabom.github.io';

function getMdxFiles(dir: string): string[] {
    const results: string[] = [];
    if (!fs.existsSync(dir)) return results;
    const walk = (current: string) => {
        for (const entry of fs.readdirSync(current)) {
            const full = path.join(current, entry);
            if (fs.statSync(full).isDirectory()) {
                walk(full);
            } else if (entry.endsWith('.mdx')) {
                results.push(full);
            }
        }
    };
    walk(dir);
    return results;
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

async function generateRSS() {
    const files = getMdxFiles(path.join(process.cwd(), 'contents', 'posts'));

    const posts = files
        .map((filePath) => {
            const { data } = matter(fs.readFileSync(filePath, 'utf8'));
            return {
                id: path.basename(filePath, '.mdx'),
                title: data.title ?? path.basename(filePath, '.mdx'),
                summary: data.summary ?? '',
                description: data.description ?? '',
                date: data.date ?? '',
                updated: data.updated ?? '',
                tags: (data.tags as string[]) ?? [],
            };
        })
        .filter((p) => p.date)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 20);

    const lastBuildDate = new Date().toUTCString();

    const items = posts.map((post) => {
        const categories = post.tags
            .map((tag) => `      <category>${escapeXml(tag)}</category>`)
            .join('\n');
        const desc = post.description || post.summary;
        return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${BASE_URL}/post/${post.id}/</link>
      <guid isPermaLink="true">${BASE_URL}/post/${post.id}/</guid>
      <description>${escapeXml(desc)}</description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
${categories}
    </item>`;
    }).join('');

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Eottabom's Lab.</title>
    <link>${BASE_URL}</link>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <description>Java, Spring, gRPC, Kubernetes, Clean Code 등 백엔드 개발 경험과 기술을 공유하는 개발자 블로그</description>
    <language>ko</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <managingEditor>eottabom@github.io (Eottabom)</managingEditor>
    ${items}
  </channel>
</rss>`;

    fs.writeFileSync(path.join('public', 'feed.xml'), rss.trim());
    console.log(`feed.xml generated (${posts.length} posts)`);
}

generateRSS();
