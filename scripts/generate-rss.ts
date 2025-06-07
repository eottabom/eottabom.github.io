import fs from 'fs';
import path from 'path';
import { getSortedPostsDataWithContent } from '../lib/posts';

const BASE_URL = 'https://eottabom.github.io';

async function generateRSS() {
    const posts = await getSortedPostsDataWithContent();

    const items = posts.slice(0, 20).map(post => `
    <item>
      <title>${post.title}</title>
      <link>${BASE_URL}/post/${post.id}</link>
      <guid isPermaLink="true">${BASE_URL}/post/${post.id}</guid>
      <description>${post.summary || ''}</description>
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
    console.log('feed.xml generated');
}

generateRSS();
