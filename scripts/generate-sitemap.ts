import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://eottabom.github.io';

function getMdxSlugs(dir: string): string[] {
    const results: string[] = [];
    if (!fs.existsSync(dir)) return results;
    const walk = (current: string) => {
        for (const entry of fs.readdirSync(current)) {
            const full = path.join(current, entry);
            if (fs.statSync(full).isDirectory()) {
                walk(full);
            } else if (entry.endsWith('.mdx')) {
                results.push(path.basename(entry, '.mdx'));
            }
        }
    };
    walk(dir);
    return results;
}

const generateSitemap = () => {
    const posts = getMdxSlugs(path.join(process.cwd(), 'contents', 'posts'));
    const books = getMdxSlugs(path.join(process.cwd(), 'contents', 'books'));

    const postUrls = posts.map((id) => `
    <url>
      <loc>${BASE_URL}/post/${id}</loc>
      <changefreq>weekly</changefreq>
      <priority>0.7</priority>
    </url>`).join('');

    const bookUrls = books.map((slug) => `
    <url>
      <loc>${BASE_URL}/book/${slug}</loc>
      <changefreq>monthly</changefreq>
      <priority>0.6</priority>
    </url>`).join('');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${postUrls}
  ${bookUrls}
</urlset>`;

    fs.writeFileSync(path.join('public', 'sitemap.xml'), sitemap.trim());
    console.log(`sitemap.xml generated (${posts.length} posts, ${books.length} books)`);
};

generateSitemap();