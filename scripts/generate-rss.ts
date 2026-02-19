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

async function generateRSS() {
    const files = getMdxFiles(path.join(process.cwd(), 'contents', 'posts'));

    const posts = files
        .map((filePath) => {
            const { data } = matter(fs.readFileSync(filePath, 'utf8'));
            return {
                id: path.basename(filePath, '.mdx'),
                title: data.title ?? path.basename(filePath, '.mdx'),
                summary: data.summary ?? '',
                date: data.date ?? '',
            };
        })
        .filter((p) => p.date)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 20);

    const items = posts.map((post) => `
    <item>
      <title>${post.title}</title>
      <link>${BASE_URL}/post/${post.id}</link>
      <guid isPermaLink="true">${BASE_URL}/post/${post.id}</guid>
      <description>${post.summary}</description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
    </item>`).join('');

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Eottabom Blog</title>
    <link>${BASE_URL}</link>
    <description>Learnings from a considerate developer</description>
    <language>ko</language>
    ${items}
  </channel>
</rss>`;

    fs.writeFileSync(path.join('public', 'feed.xml'), rss.trim());
    console.log(`feed.xml generated (${posts.length} posts)`);
}

generateRSS();