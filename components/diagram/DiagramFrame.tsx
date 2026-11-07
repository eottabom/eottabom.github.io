import { ReactNode, useEffect, useRef, useState } from 'react';
import { Loader2, Maximize2, Minimize2, X } from 'lucide-react';

// 개발 서버 전용 그림 편집 창의 공통 틀. 글 안의 그 자리(anchor)에 본문 폭으로 끼워 넣고, 필요하면 전체 화면으로 키운다.
// 위쪽 막대에 편집기 이름, 파일 경로, 상태, 편집기별 버튼(actions), 전체 화면 전환, 닫기를 둔다.
// 새 그림은 처음 저장하기 전까지 파일 이름을 바꿀 수 있다. 폴더와 확장자는 고정이다.

export type Box = { top: number; left: number; width: number };

const INLINE_HEIGHT = 640;
const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type DiagramFile = ReturnType<typeof useDiagramFile>;

// 그림 파일 경로를 폴더, 이름, 확장자로 나눠 들고, 새 그림이면 처음 저장할 때까지 이름을 바꿀 수 있게 한다.
export function useDiagramFile(initialPath: string, isNew: boolean) {
  const slash = initialPath.lastIndexOf('/') + 1;
  const dot = initialPath.indexOf('.', slash);
  const dir = initialPath.slice(0, slash);
  const suffix = initialPath.slice(dot);
  const [name, setName] = useState(initialPath.slice(slash, dot));
  const [created, setCreated] = useState(!isNew);
  const editable = !created;
  return {
    path: `${dir}${name}${suffix}`,
    dir,
    name,
    suffix,
    setName,
    editable,
    nameError: editable && !NAME_PATTERN.test(name) ? '이름은 영문 소문자, 숫자, - 만 쓸 수 있습니다.' : '',
    markCreated: () => setCreated(true),
  };
}

type Props = {
  name: string;
  file: DiagramFile;
  anchor: Box;
  busy: boolean;
  status: string;
  error: string;
  actions?: ReactNode;
  onClose: () => void;
  children: ReactNode;
};

export const frameButton = 'inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-gray-100';

export default function DiagramFrame({ name, file, anchor, busy, status, error, actions, onClose, children }: Props) {
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
      <div className="flex items-center gap-3 whitespace-nowrap border-b border-gray-200 px-4 py-2 text-xs text-gray-600">
        <span className="font-medium text-gray-900">{name}</span>
        {file.editable ? (
          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-700">
            {file.dir}
            <input
              value={file.name}
              onChange={(e) => file.setName(e.target.value)}
              aria-label="파일 이름"
              title="처음 저장하기 전까지 바꿀 수 있습니다"
              spellCheck={false}
              className="rounded border border-blue-300 bg-white px-1 text-gray-900 outline-none focus:border-blue-500"
              style={{ width: `${Math.max(file.name.length, 4) + 2}ch` }}
            />
            {file.suffix}
          </code>
        ) : (
          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-700">{file.path}</code>
        )}
        {busy && <Loader2 size={13} className="animate-spin text-blue-600" />}
        <span data-diagram-status={status}>{status}</span>
        {(file.nameError || error) && (
          <span className="min-w-0 truncate text-red-600" title={file.nameError || error}>
            {file.nameError || error}
          </span>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-1">
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
