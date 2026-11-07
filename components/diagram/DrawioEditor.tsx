import { useEffect, useRef, useState } from 'react';
import DiagramFrame, { Box } from './DiagramFrame';

// 개발 서버 전용 draw.io 편집 창.
// embed.diagrams.net 을 iframe 으로 띄우고 postMessage(JSON 프로토콜)로 주고받는다.
// 저장하면 draw.io 원본 데이터가 함께 들어 있는 SVG(.drawio.svg)를 dev-image API 로 쓴다.
// 그림 데이터는 브라우저 안에서만 오가고 diagrams.net 서버로 올라가지 않는다.

const ORIGIN = 'https://embed.diagrams.net';
const EMBED_URL = `${ORIGIN}/?embed=1&proto=json&spin=1&saveAndExit=1&noExitBtn=0&libraries=1&lang=ko`;
const API = '/api/dev-image/';

type Props = {
  path: string;
  anchor: Box;
  isNew: boolean;
  onClose: () => void;
  onSaved: (path: string) => void;
};

// .drawio.svg 의 content 속성에 들어 있는 draw.io 원본(mxfile)을 꺼낸다.
const extractDrawioXml = (svg: string): string => {
  const root = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement;
  return root.getAttribute('content') ?? '';
};

// export 결과(data:image/svg+xml;base64,...)를 UTF-8 문자열로 되돌린다.
const decodeSvgDataUri = (dataUri: string): string => {
  const base64 = dataUri.slice(dataUri.indexOf(',') + 1);
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

export default function DrawioEditor({ path, anchor, isNew, onClose, onSaved }: Props) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const exitAfterSave = useRef(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'saving'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const send = (message: Record<string, unknown>) =>
      frameRef.current?.contentWindow?.postMessage(JSON.stringify(message), ORIGIN);

    const write = async (svg: string) => {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, svg }),
      });
      if (!res.ok) {
        const { message } = await res.json().catch(() => ({ message: '저장하지 못했습니다.' }));
        throw new Error(message);
      }
    };

    const onMessage = async (event: MessageEvent) => {
      if (event.origin !== ORIGIN || event.source !== frameRef.current?.contentWindow) return;
      const msg = JSON.parse(event.data);

      if (msg.event === 'init') {
        let xml = '';
        if (!isNew) {
          const res = await fetch(`${API}?path=${encodeURIComponent(path)}`);
          if (!res.ok) return setError('그림 파일을 불러오지 못했습니다.');
          xml = extractDrawioXml(await res.text());
        }
        send({ action: 'load', xml, title: path.split('/').pop(), autosave: 0 });
        setStatus('ready');
      } else if (msg.event === 'save') {
        exitAfterSave.current = Boolean(msg.exit);
        setStatus('saving');
        send({ action: 'export', format: 'xmlsvg', spinKey: 'saving' });
      } else if (msg.event === 'export') {
        try {
          await write(decodeSvgDataUri(msg.data));
          send({ action: 'status', message: '저장했습니다.', modified: false });
          onSaved(path);
          if (exitAfterSave.current) onClose();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setStatus('ready');
        }
      } else if (msg.event === 'exit') {
        onClose();
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [path, isNew, onClose, onSaved]);

  return (
    <DiagramFrame
      name="draw.io"
      path={path}
      anchor={anchor}
      busy={status !== 'ready'}
      status={status === 'loading' ? '불러오는 중' : status === 'saving' ? '저장 중' : isNew ? '새 그림' : '편집 중'}
      error={error}
      onClose={onClose}
    >
      <iframe ref={frameRef} src={EMBED_URL} title="draw.io 편집기" className="absolute inset-0 h-full w-full border-0" />
    </DiagramFrame>
  );
}
