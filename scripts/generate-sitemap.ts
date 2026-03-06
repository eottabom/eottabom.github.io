import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const BASE_URL = 'https://eottabom.github.io';

function getMdxFilesWithMeta(dir: string): { slug: string; date?: string; updated?: string }[] {
    const results: { slug: string; date?: string; updated?: string }[] = [];
    if (!fs.existsSync(dir)) return results;
    const walk = (current: string) => {
        for (const entry of fs.readdirSync(current)) {
            const full = path.join(current, entry);
            if (fs.statSync(full).isDirectory()) {
                walk(full);
            } else if (entry.endsWith('.mdx')) {
                const { data } = matter(fs.readFileSync(full, 'utf8'));
                results.push({
                    slug: path.basename(entry, '.mdx'),
                    date: data.date ?? undefined,
                    updated: data.updated ?? undefined,
                });
            }
        }
    };
    walk(dir);
    return results;
}

function toW3CDate(dateStr?: string): string | undefined {
    if (!dateStr) return undefined;
    try {
        return new Date(dateStr).toISOString().split('T')[0];
    } catch {
        return undefined;
    }
}

const generateSitemap = () => {
    const posts = getMdxFilesWithMeta(path.join(process.cwd(), 'contents', 'posts'));
    const books = getMdxFilesWithMeta(path.join(process.cwd(), 'contents', 'books'));

    const today = new Date().toISOString().split('T')[0];

    // Static pages
    const staticPages = [
        { loc: `${BASE_URL}/`, changefreq: 'daily', priority: '1.0', lastmod: today },
        { loc: `${BASE_URL}/post/`, changefreq: 'daily', priority: '0.9', lastmod: today },
        { loc: `${BASE_URL}/book/`, changefreq: 'weekly', priority: '0.7', lastmod: today },
        { loc: `${BASE_URL}/about/`, changefreq: 'monthly', priority: '0.5' },
        { loc: `${BASE_URL}/link/`, changefreq: 'monthly', priority: '0.4' },
    ];

    const staticUrls = staticPages.map((p) => `
    <url>
      <loc>${p.loc}</loc>
      <changefreq>${p.changefreq}</changefreq>
      <priority>${p.priority}</priority>${p.lastmod ? `\n      <lastmod>${p.lastmod}</lastmod>` : ''}
    </url>`).join('');

    const postUrls = posts.map((p) => {
        const lastmod = toW3CDate(p.updated) || toW3CDate(p.date);
        return `
    <url>
      <loc>${BASE_URL}/post/${p.slug}/</loc>
      <changefreq>weekly</changefreq>
      <priority>0.7</priority>${lastmod ? `\n      <lastmod>${lastmod}</lastmod>` : ''}
    </url>`;
    }).join('');

    const bookUrls = books.map((b) => {
        const lastmod = toW3CDate(b.updated) || toW3CDate(b.date);
        return `
    <url>
      <loc>${BASE_URL}/book/${b.slug}/</loc>
      <changefreq>monthly</changefreq>
      <priority>0.6</priority>${lastmod ? `\n      <lastmod>${lastmod}</lastmod>` : ''}
    </url>`;
    }).join('');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticUrls}
  ${postUrls}
  ${bookUrls}
</urlset>`;

    fs.writeFileSync(path.join('public', 'sitemap.xml'), sitemap.trim());
    console.log(`sitemap.xml generated (${staticPages.length} static, ${posts.length} posts, ${books.length} books)`);
};

generateSitemap();