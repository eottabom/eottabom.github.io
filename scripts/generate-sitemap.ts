import fs from 'fs';
import path from 'path';
import { getAllPostIds } from '../lib/posts';

const BASE_URL = 'https://eottabom.github.io';

const generateSitemap = () => {
    const posts = getAllPostIds();

    const urls = posts.map(({ params }) => `
    <url>
      <loc>${BASE_URL}/post/${params.id}</loc>
      <changefreq>weekly</changefreq>
      <priority>0.7</priority>
    </url>
  `).join('');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls}
  </urlset>`;

    fs.writeFileSync(path.join('public', 'sitemap.xml'), sitemap.trim());
    console.log('sitemap.xml generated');
};

generateSitemap();
