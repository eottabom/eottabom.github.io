import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAllMdxFiles } from '../../lib/posts';

// 개발 서버 전용 로컬 편집 API. 글 화면에서 고친 내용을 contents/posts 의 mdx 파일에 저장한다.
// 정적 export 빌드에서는 API 라우트가 빠지고, 개발 서버가 아니면 404 를 돌려준다.
//   GET  ?id&start&end      : 본문 블록 원문
//   GET  ?id&kind=meta      : frontmatter
//   POST { id, start, end, original, text } : 본문 블록 교체 (start === end 면 삽입, text 가 비면 삭제)
//   POST { id, kind: 'meta', fields }       : frontmatter 필드 수정

const META_FIELDS = ['title', 'date', 'updated', 'tags', 'summary', 'description'] as const;

function findPostFile(id: string): string | undefined {
  return getAllMdxFiles().find((file) => path.basename(file, '.mdx') === id);
}

// data-src 의 위치는 frontmatter 를 뺀 본문 기준이라, 파일 안에서 본문이 시작하는 위치를 더한다.
function bodyOffset(file: string): number {
  const { content } = matter(file);
  if (!file.endsWith(content)) throw new Error('frontmatter 뒤 본문 위치를 찾지 못했습니다.');
  return file.length - content.length;
}

// frontmatter 는 다시 직렬화하지 않고 해당 줄만 바꿔서, 기존 따옴표와 배열 표기를 그대로 둔다.
function updateFrontmatter(file: string, fields: Record<string, unknown>): string {
  const end = file.indexOf('\n---', 3);
  if (!file.startsWith('---') || end < 0) throw new Error('frontmatter 를 찾지 못했습니다.');
  let lines = file.slice(0, end).split('\n');

  for (const key of META_FIELDS) {
    if (!(key in fields)) continue;
    const value = fields[key];
    const index = lines.findIndex((line) => line.startsWith(`${key}:`));
    if (index >= 0 && /^\s/.test(lines[index + 1] ?? '')) {
      throw new Error(`${key} 가 여러 줄로 되어 있어 화면에서 고칠 수 없습니다.`);
    }

    const isEmpty = value === '' || (Array.isArray(value) && value.length === 0);
    if (isEmpty && key === 'updated') {
      if (index >= 0) lines = lines.filter((_, i) => i !== index);
      continue;
    }
    const formatted = Array.isArray(value)
      ? `[${value.map((v) => JSON.stringify(String(v))).join(', ')}]`
      : JSON.stringify(String(value ?? ''));
    const line = `${key}: ${formatted}`;
    if (index >= 0) lines[index] = line;
    else lines.splice(key === 'updated' ? Math.max(1, lines.findIndex((l) => l.startsWith('date:')) + 1) : lines.length, 0, line);
  }
  return lines.join('\n') + file.slice(end);
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV !== 'development') return res.status(404).end();

  const params = req.method === 'GET' ? req.query : req.body;
  const filePath = typeof params.id === 'string' ? findPostFile(params.id) : undefined;
  if (!filePath) return res.status(404).json({ message: '글을 찾지 못했습니다.' });
  const file = fs.readFileSync(filePath, 'utf8');

  try {
    if (params.kind === 'meta') {
      if (req.method === 'GET') {
        const { data } = matter(file);
        return res.status(200).json(Object.fromEntries(META_FIELDS.map((key) => [key, data[key] ?? (key === 'tags' ? [] : '')])));
      }
      if (req.method === 'POST') {
        fs.writeFileSync(filePath, updateFrontmatter(file, params.fields ?? {}));
        return res.status(200).json({ ok: true });
      }
      return res.status(405).end();
    }

    const offset = bodyOffset(file);
    const from = offset + Number(params.start);
    const to = offset + Number(params.end);
    const current = file.slice(from, to);

    if (req.method === 'GET') return res.status(200).json({ source: current });

    if (req.method === 'POST') {
      const { original, text } = req.body;
      // 화면을 연 뒤 파일이 바뀌었으면 엉뚱한 위치를 덮어쓰지 않도록 저장을 막는다.
      if (current !== original) {
        return res.status(409).json({ message: '파일이 그 사이에 바뀌었습니다. 새로고침 후 다시 편집해 주세요.' });
      }
      let before = file.slice(0, from);
      let after = file.slice(to);
      if (from === to) {
        // 블록 뒤에 새 블록 삽입: 빈 줄로 구분한다.
        after = `\n\n${text.trim()}${after}`;
      } else if (text.trim() === '') {
        // 블록 삭제: 앞뒤 빈 줄이 겹치지 않게 정리한다.
        before = before.replace(/\n+$/, '');
        after = after.replace(/^\n+/, '');
        after = before && after ? `\n\n${after}` : after;
      } else {
        before += text;
      }
      fs.writeFileSync(filePath, before + after);
      return res.status(200).json({ ok: true });
    }
  } catch (e) {
    return res.status(400).json({ message: (e as Error).message });
  }

  return res.status(405).end();
}
