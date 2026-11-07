import fs from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAllMdxFiles } from '../../lib/posts';

// 개발 서버 전용 그림 편집 API. 글 화면에서 그린 draw.io, Excalidraw 그림을 public/img/post 아래 SVG 로 저장한다.
// 정적 export 빌드에서는 API 라우트가 빠지고, 개발 서버가 아니면 404 를 돌려준다.
//   GET  ?id&kind=dir   : 글의 그림을 둘 기본 폴더 (/img/post/<카테고리>/<글 id>)
//   GET  ?path          : 그림 SVG 원문
//   POST { path, svg, create } : 그림 SVG 저장 (없으면 폴더까지 만든다). create 면 같은 이름의 파일이 있을 때 덮어쓰지 않는다.
//   DELETE { path }     : 그림 SVG 삭제. contents 아래 다른 글이 아직 쓰고 있으면 지우지 않는다.

const IMAGE_ROOT = path.join(process.cwd(), 'public', 'img', 'post');
const EDITABLE_SUFFIXES = ['.drawio.svg', '.excalidraw.svg'];

export const config = { api: { bodyParser: { sizeLimit: '20mb' } } };

// /img/post/... 로 시작하고 편집 가능한 확장자인 경로만 public 아래 실제 파일 경로로 바꾼다.
function resolveImage(publicPath: unknown): string {
  if (typeof publicPath !== 'string' || !publicPath.startsWith('/img/post/')) {
    throw new Error('/img/post/ 아래 경로만 쓸 수 있습니다.');
  }
  if (!EDITABLE_SUFFIXES.some((suffix) => publicPath.endsWith(suffix))) {
    throw new Error('.drawio.svg, .excalidraw.svg 파일만 편집할 수 있습니다.');
  }
  const file = path.join(process.cwd(), 'public', publicPath);
  if (!file.startsWith(IMAGE_ROOT + path.sep)) throw new Error('잘못된 경로입니다.');
  return file;
}

// contents 아래 원문 파일 중 이 그림 경로를 쓰는 파일을 찾는다.
function findReferences(publicPath: string, dir = path.join(process.cwd(), 'contents')): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return findReferences(publicPath, full);
    if (!/\.(mdx?|json)$/.test(entry.name)) return [];
    return fs.readFileSync(full, 'utf8').includes(publicPath) ? [path.relative(process.cwd(), full)] : [];
  });
}

function postImageDir(id: string): string {
  const file = getAllMdxFiles().find((f) => path.basename(f, '.mdx') === id);
  if (!file) throw new Error('글을 찾지 못했습니다.');
  const category = path.basename(path.dirname(file));
  return `/img/post/${category}/${id}`;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV !== 'development') return res.status(404).end();

  try {
    if (req.method === 'GET') {
      if (req.query.kind === 'dir') return res.status(200).json({ dir: postImageDir(String(req.query.id)) });
      const file = resolveImage(req.query.path);
      if (!fs.existsSync(file)) return res.status(404).json({ message: '그림 파일이 없습니다.' });
      res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
      return res.status(200).send(fs.readFileSync(file, 'utf8'));
    }

    if (req.method === 'POST') {
      const { path: publicPath, svg, create } = req.body ?? {};
      const file = resolveImage(publicPath);
      if (typeof svg !== 'string' || !svg.includes('<svg')) throw new Error('SVG 내용이 아닙니다.');
      if (create && fs.existsSync(file)) {
        return res.status(409).json({ message: '같은 이름의 그림이 있습니다. 다른 이름을 써 주세요.' });
      }
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, svg, 'utf8');
      return res.status(200).json({ path: publicPath });
    }

    if (req.method === 'DELETE') {
      const { path: publicPath } = req.body ?? {};
      const file = resolveImage(publicPath);
      const references = findReferences(publicPath);
      if (references.length > 0) {
        return res.status(409).json({ message: `${references.join(', ')} 에서 쓰는 그림이라 파일은 남겼습니다.` });
      }
      if (fs.existsSync(file)) fs.unlinkSync(file);
      return res.status(200).json({ path: publicPath });
    }

    return res.status(405).end();
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
}
