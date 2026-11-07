import { ReactNode, useEffect, useRef, useState } from 'react';
import { Loader2, Maximize2, Minimize2, X } from 'lucide-react';

// 개발 서버 전용 그림 편집 창의 공통 틀. 글 안의 그 자리(anchor)에 본문 폭으로 끼워 넣고, 필요하면 전체 화면으로 키운다.
// 위쪽 막대에 편집기 이름, 파일 경로, 상태, 편집기별 버튼(actions), 전체 화면 전환, 닫기를 둔다.

export type Box = { top: number; left: number; width: number };

const INLINE_HEIGHT = 640;

type Props = {
  name: string;
  path: string;
  anchor: Box;
  busy: boolean;
  status: string;
  error: string;
  actions?: ReactNode;
  onClose: () => void;
  children: ReactNode;
};

export const frameButton = 'inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-gray-100';

export default function DiagramFrame({ name, path, anchor, busy, status, error, actions, onClose, children }: Props) {
  const [fullscreen, setFullscreen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // 열리면 편집 창이 화면에 보이도록 스크롤한다.
  useEffect(() => {
    boxRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, []);

  return (
    <div
      ref={boxRef}
      className={
        fullscreen
          ? 'fixed inset-0 z-[80] flex flex-col bg-white'
          : 'absolute z-[55] flex flex-col overflow-hidden rounded-lg border border-blue-300 bg-white shadow-xl'
      }
      style={fullscreen ? undefined : { top: anchor.top, left: anchor.left, width: anchor.width, height: INLINE_HEIGHT }}
    >
      <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-2 text-xs text-gray-600">
        <span className="font-medium text-gray-900">{name}</span>
        <code className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-700">{path}</code>
        {busy && <Loader2 size={13} className="animate-spin text-blue-600" />}
        <span data-diagram-status={status}>{status}</span>
        {error && <span className="text-red-600">{error}</span>}
        <div className="ml-auto flex items-center gap-1">
          {actions}
          <button type="button" onClick={() => setFullscreen(!fullscreen)} className={frameButton}>
            {fullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            {fullscreen ? '본문에 끼우기' : '전체 화면'}
          </button>
          <button type="button" onClick={onClose} className={frameButton} title="저장하지 않은 내용은 사라집니다">
            <X size={13} /> 닫기
          </button>
        </div>
      </div>
      <div className="relative min-h-0 flex-1">{children}</div>
    </div>
  );
}
