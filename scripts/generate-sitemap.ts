import fs from 'fs';
import path from 'path';
import { getAllPostIds } from '../lib/posts';
import { getBooksMetaOnly } from '../lib/books';

const BASE_URL = 'https://eottabom.github.io';

const generateSitemap = () => {
    const posts = getAllPostIds();
    const books = getBooksMetaOnly();

    const postUrls = posts.map(({ params }) => `
    <url>
      <loc>${BASE_URL}/post/${params.id}</loc>
      <changefreq>weekly</changefreq>
      <priority>0.7</priority>
    </url>
  `).join('');

    const bookUrls = books.map((book) => `
    <url>
      <loc>${BASE_URL}/book/${book.slug}</loc>
      <changefreq>monthly</changefreq>
      <priority>0.6</priority>
    </url>
  `).join('');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${postUrls}
    ${bookUrls}
  </urlset>`;

    fs.writeFileSync(path.join('public', 'sitemap.xml'), sitemap.trim());
    console.log('sitemap.xml generated');
};

generateSitemap();
