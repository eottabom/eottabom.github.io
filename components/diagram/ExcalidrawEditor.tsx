import { ComponentProps, useCallback, useEffect, useRef, useState } from 'react';
import { Check, Save } from 'lucide-react';
import { Excalidraw, exportToSvg, loadFromBlob } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import DiagramFrame, { Box, frameButton, useDiagramFile } from './DiagramFrame';

// 개발 서버 전용 Excalidraw 편집 창. 그리기 메뉴에서 열 때만 불러온다(DevEditor 의 dynamic import).
// 저장하면 Excalidraw 원본(scene)이 함께 들어 있는 SVG(.excalidraw.svg)를 dev-image API 로 쓴다.
// 다시 열 때는 그 SVG 에서 원본을 꺼내 이어서 편집한다.

const API = '/api/dev-image/';

type ExcalidrawImperativeAPI = Parameters<NonNullable<ComponentProps<typeof Excalidraw>['excalidrawAPI']>>[0];

type Props = {
  path: string;
  anchor: Box;
  isNew: boolean;
  onClose: () => void;
  onSaved: (path: string) => void;
};

export default function ExcalidrawEditor({ path, anchor, isNew, onClose, onSaved }: Props) {
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'saving'>(isNew ? 'ready' : 'loading');
  const [error, setError] = useState('');
  const file = useDiagramFile(path, isNew);

  // 기존 그림은 SVG 안에 들어 있는 원본을 꺼내 초기 데이터로 쓴다.
  const [initialData] = useState(() =>
    isNew
      ? null
      : (async () => {
          try {
            const res = await fetch(`${API}?path=${encodeURIComponent(path)}`);
            if (!res.ok) throw new Error('그림 파일을 불러오지 못했습니다.');
            const scene = await loadFromBlob(new Blob([await res.text()], { type: 'image/svg+xml' }), null, null);
            return { elements: scene.elements, appState: scene.appState, files: scene.files, scrollToContent: true };
          } catch (e) {
            setError((e as Error).message);
            return null;
          } finally {
            setStatus('ready');
          }
        })(),
  );

  const save = useCallback(
    async (exit: boolean) => {
      const api = apiRef.current;
      if (!api || status !== 'ready' || file.nameError) return;
      setStatus('saving');
      setError('');
      try {
        const appState = api.getAppState();
        const svg = await exportToSvg({
          elements: api.getSceneElements(),
          appState: { ...appState, exportEmbedScene: true, exportBackground: true },
          files: api.getFiles(),
        });
        const res = await fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: file.path, svg: svg.outerHTML, create: file.editable }),
        });
        if (!res.ok) {
          const { message } = await res.json().catch(() => ({ message: '저장하지 못했습니다.' }));
          throw new Error(message);
        }
        file.markCreated();
        onSaved(file.path);
        if (exit) onClose();
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setStatus('ready');
      }
    },
    [file, status, onClose, onSaved],
  );

  // Excalidraw 안에서 ⌘S / Ctrl+S 를 누르면 브라우저 저장 대신 이 파일로 저장한다.
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        event.stopPropagation();
        save(false);
      }
    };
    box.addEventListener('keydown', onKeyDown, true);
    return () => box.removeEventListener('keydown', onKeyDown, true);
  }, [save]);

  return (
    <DiagramFrame
      name="Excalidraw"
      file={file}
      anchor={anchor}
      busy={status !== 'ready'}
      status={status === 'loading' ? '불러오는 중' : status === 'saving' ? '저장 중' : file.editable ? '새 그림' : '편집 중'}
      error={error}
      onClose={onClose}
      actions={
        <>
          <button type="button" onClick={() => save(false)} className={`${frameButton} disabled:opacity-40`} disabled={status !== 'ready' || Boolean(file.nameError)}>
            <Save size={13} /> 저장
          </button>
          <button type="button" onClick={() => save(true)} className={`${frameButton} disabled:opacity-40`} disabled={status !== 'ready' || Boolean(file.nameError)}>
            <Check size={13} /> 저장 후 닫기
          </button>
        </>
      }
    >
      <div ref={boxRef} className="absolute inset-0">
        <Excalidraw
          excalidrawAPI={(api) => (apiRef.current = api)}
          initialData={initialData}
          langCode="ko-KR"
          autoFocus
          UIOptions={{ canvasActions: { loadScene: false, saveToActiveFile: false, export: false } }}
        />
      </div>
    </DiagramFrame>
  );
}
