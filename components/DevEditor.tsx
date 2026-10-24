import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/router';
import {
  Bold,
  ChevronDown,
  Code,
  CornerDownLeft,
  FileText,
  Link as LinkIcon,
  Loader2,
  Palette,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';

// 개발 서버 전용 글 화면 편집기.
// 본문 블록에 마우스를 올리면 테두리와 버튼이 나오고, 연필(또는 더블클릭)로 그 블록을, + 로 그 아래에 새 블록을 편집한다.
// 블록 위치는 lib/remarkSourceRange.ts 가 남긴 data-src, 저장은 pages/api/dev-edit.ts 가 맡는다.

type Box = { top: number; left: number; width: number; height: number };
type Editing = { start: number; end: number; original: string; box: Box; insert: boolean };
type Meta = { title: string; date: string; updated: string; tags: string[]; summary: string; description: string };
type Menu = 'type' | 'color' | 'insert' | null;

const STORAGE_KEY = 'dev-editor-enabled';
const API = '/api/dev-edit/';

const LINE_TYPES = [
  { label: '본문', prefix: '' },
  { label: '제목 2', prefix: '## ' },
  { label: '제목 3', prefix: '### ' },
  { label: '제목 4', prefix: '#### ' },
  { label: '목록', prefix: '- ' },
  { label: '번호 목록', prefix: '1. ' },
];

const COLORS = [
  { label: '파랑', tag: 'BlueText', className: 'text-blue-600' },
  { label: '빨강', tag: 'RedText', className: 'text-red-600' },
  { label: '초록', tag: 'GreenText', className: 'text-green-600' },
];

const PANELS = [
  { type: 'info', label: '정보' },
  { type: 'note', label: '노트' },
  { type: 'tip', label: '팁' },
  { type: 'warning', label: '주의' },
  { type: 'danger', label: '위험' },
  { type: 'success', label: '성공' },
  { type: 'neutral', label: '기본' },
  { type: 'quote', label: '인용' },
];

// 삽입할 블록 템플릿. select 는 삽입 후 선택해 둘 글자(바로 덮어쓸 수 있게)다.
const BLOCKS: { label: string; text: string; select: string }[] = [
  { label: '코드 블록', text: '```java\n코드\n```', select: 'java' },
  {
    label: '탭',
    text: '<Tabs>\n    <Tab label="탭 1">\n        내용\n    </Tab>\n    <Tab label="탭 2">\n        내용\n    </Tab>\n</Tabs>',
    select: '탭 1',
  },
  { label: '표', text: '| 항목 | 내용 |\n| --- | --- |\n| 항목 | 내용 |', select: '항목' },
  {
    label: '이미지',
    text: "<div style={{ textAlign: 'center' }}>\n    <img src=\"/img/post/경로.png\" alt=\"설명\" style={{ display: 'inline-block' }} />\n</div>",
    select: '/img/post/경로.png',
  },
  { label: '구분선', text: '---', select: '' },
];

function displayElement(el: HTMLElement): HTMLElement {
  return (el.closest('.code-block') as HTMLElement) ?? (el.closest('.table-scroll') as HTMLElement) ?? el;
}

function boxOf(el: HTMLElement): Box {
  const r = displayElement(el).getBoundingClientRect();
  return { top: r.top + window.scrollY, left: r.left + window.scrollX, width: r.width, height: r.height };
}

function parseRange(el: HTMLElement): [number, number] {
  const [start, end] = (el.dataset.src ?? '').split('-').map(Number);
  return [start, end];
}

export default function DevEditor({ postId, containerSelector = 'article' }: { postId: string; containerSelector?: string }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(true);
  const [hovered, setHovered] = useState<HTMLElement | null>(null);
  const [hoverBox, setHoverBox] = useState<Box | null>(null);
  const [metaBox, setMetaBox] = useState<Box | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [text, setText] = useState('');
  const [menu, setMenu] = useState<Menu>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      setEnabled(localStorage.getItem(STORAGE_KEY) !== 'off');
    } catch {}
  }, []);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    setHovered(null);
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off');
    } catch {}
  };

  const reset = () => {
    setEditing(null);
    setMeta(null);
    setMenu(null);
    setConfirmDelete(false);
    setError('');
  };

  const open = useCallback(
    async (el: HTMLElement, insert = false) => {
      const [start, end] = parseRange(el);
      setError('');
      if (insert) {
        setEditing({ start: end, end, original: '', box: boxOf(el), insert: true });
        setText('');
      } else {
        const res = await fetch(`${API}?id=${encodeURIComponent(postId)}&start=${start}&end=${end}`);
        if (!res.ok) return setError('원문을 불러오지 못했습니다.');
        const { source } = await res.json();
        setEditing({ start, end, original: source, box: boxOf(el), insert: false });
        setText(source);
      }
      setHovered(null);
    },
    [postId],
  );

  const openMeta = async () => {
    const res = await fetch(`${API}?id=${encodeURIComponent(postId)}&kind=meta`);
    if (res.ok) {
      setMeta(await res.json());
      setEditing(null);
    }
  };

  // 본문 블록 위에 마우스가 있으면 그 블록을 강조한다.
  useEffect(() => {
    if (!enabled || editing || meta) return;
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const blockOf = (e: Event) => {
      const block = (e.target as HTMLElement).closest('[data-src]') as HTMLElement | null;
      return block && container.contains(block) ? block : null;
    };
    const onOver = (e: Event) => {
      const block = blockOf(e);
      if (block) {
        setHovered(block);
        setHoverBox(boxOf(block));
        setMetaBox(null);
      }
    };
    const onDoubleClick = (e: Event) => {
      const block = blockOf(e);
      if (block) {
        window.getSelection()?.removeAllRanges();
        open(block);
      }
    };
    // 글 제목, 태그 영역(data-dev-meta)은 글 정보 편집창으로 연다.
    const metaElements = Array.from(document.querySelectorAll<HTMLElement>('[data-dev-meta]'));
    const onMetaOver = () => {
      const boxes = metaElements.map((el) => boxOf(el));
      const top = Math.min(...boxes.map((b) => b.top));
      const bottom = Math.max(...boxes.map((b) => b.top + b.height));
      setMetaBox({ top, left: boxes[0].left, width: Math.max(...boxes.map((b) => b.width)), height: bottom - top });
      setHovered(null);
    };
    const onMetaDoubleClick = () => {
      window.getSelection()?.removeAllRanges();
      openMeta();
    };

    container.addEventListener('mouseover', onOver);
    container.addEventListener('dblclick', onDoubleClick);
    metaElements.forEach((el) => {
      el.addEventListener('mouseover', onMetaOver);
      el.addEventListener('dblclick', onMetaDoubleClick);
    });
    return () => {
      container.removeEventListener('mouseover', onOver);
      container.removeEventListener('dblclick', onDoubleClick);
      metaElements.forEach((el) => {
        el.removeEventListener('mouseover', onMetaOver);
        el.removeEventListener('dblclick', onMetaDoubleClick);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, editing, meta, containerSelector, open]);

  // 편집창 높이를 내용에 맞춘다.
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight + 2}px`;
  }, [text, editing]);

  useEffect(() => {
    if (editing) textareaRef.current?.focus();
  }, [editing]);

  const post = async (body: Record<string, unknown>) => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId, ...body }),
      });
      if (!res.ok) {
        const { message } = await res.json().catch(() => ({ message: '저장하지 못했습니다.' }));
        setError(message);
        return;
      }
      await router.replace(router.asPath, undefined, { scroll: false });
      reset();
    } finally {
      setSaving(false);
    }
  };

  const save = () => {
    if (!editing || saving) return;
    if (text === editing.original || (editing.insert && !text.trim())) return reset();
    post({ start: editing.start, end: editing.end, original: editing.original, text });
  };

  const remove = () => {
    if (!editing || editing.insert) return;
    if (!confirmDelete) return setConfirmDelete(true);
    post({ start: editing.start, end: editing.end, original: editing.original, text: '' });
  };

  // textarea 내용을 바꾼다. execCommand 로 넣어야 되돌리기(⌘Z)가 동작한다.
  const replaceRange = (from: number, to: number, value: string, select?: [number, number]) => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.focus();
    ta.setSelectionRange(from, to);
    document.execCommand('insertText', false, value);
    if (select) ta.setSelectionRange(from + select[0], from + select[1]);
  };

  // 선택한 글자를 앞뒤 기호로 감싼다. 선택이 없으면 placeholder 를 넣고 선택해 둔다.
  const wrap = (before: string, after: string, placeholder: string, selectInAfter?: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e } = ta;
    const selected = ta.value.slice(s, e) || placeholder;
    const value = `${before}${selected}${after}`;
    if (selectInAfter) {
      const at = before.length + selected.length + after.indexOf(selectInAfter);
      replaceRange(s, e, value, [at, at + selectInAfter.length]);
    } else {
      replaceRange(s, e, value, [before.length, before.length + selected.length]);
    }
    setMenu(null);
  };

  // 커서 위치에 새 블록을 넣는다. 앞뒤 블록과 빈 줄로 구분한다.
  const insertBlock = (block: string, select: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e, value } = ta;
    const head = value.slice(0, s);
    const tail = value.slice(e);
    const prefix = head === '' || head.endsWith('\n\n') ? '' : head.endsWith('\n') ? '\n' : '\n\n';
    const suffix = tail === '' || tail.startsWith('\n\n') ? '' : tail.startsWith('\n') ? '\n' : '\n\n';
    const at = prefix.length + (select ? block.indexOf(select) : block.length);
    replaceRange(s, e, `${prefix}${block}${suffix}`, [at, at + select.length]);
    setMenu(null);
  };

  // 선택한 줄들의 종류(제목, 목록, 본문)를 바꾼다.
  const setLineType = (prefix: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e, value } = ta;
    const from = value.lastIndexOf('\n', s - 1) + 1;
    const lineEnd = value.indexOf('\n', e);
    const to = lineEnd < 0 ? value.length : lineEnd;
    const lines = value
      .slice(from, to)
      .split('\n')
      .map((line, i) => {
        const body = line.replace(/^(#{1,6}\s+|[-*]\s+|\d+\.\s+)/, '');
        return (prefix === '1. ' ? `${i + 1}. ` : prefix) + body;
      });
    const next = lines.join('\n');
    replaceRange(from, to, next, [next.length, next.length]);
    setMenu(null);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const mod = e.metaKey || e.ctrlKey;
    const key = e.key.toLowerCase();
    if (e.key === 'Escape') {
      e.preventDefault();
      reset();
    } else if (mod && e.key === 'Enter') {
      e.preventDefault();
      save();
    } else if (mod && key === 'b') {
      e.preventDefault();
      wrap('**', '**', '굵게');
    } else if (mod && key === 'e') {
      e.preventDefault();
      wrap('`', '`', 'code');
    } else if (mod && key === 'k') {
      e.preventDefault();
      wrap('[', '](https://)', '링크', 'https://');
    }
  };

  const tool = 'inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900';
  const menuBox = 'absolute left-0 top-full z-10 mt-1 min-w-[8rem] rounded-md border border-gray-200 bg-white py-1 shadow-lg';
  const menuItem = 'block w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50';
  // 툴바 버튼을 눌러도 textarea 의 선택 영역이 풀리지 않게 한다.
  const keepSelection = (e: React.MouseEvent) => e.preventDefault();

  const dropdown = (name: Exclude<Menu, null>, label: React.ReactNode, items: React.ReactNode) => (
    <div className="relative">
      <button type="button" className={tool} onMouseDown={keepSelection} onClick={() => setMenu(menu === name ? null : name)}>
        {label}
        <ChevronDown size={12} />
      </button>
      {menu === name && <div className={menuBox}>{items}</div>}
    </div>
  );

  const editorTop = editing ? (editing.insert ? editing.box.top + editing.box.height + 12 : editing.box.top - 8) : 0;

  return createPortal(
    <>
      <div className="fixed bottom-6 left-16 z-[60] flex items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm transition ${
            enabled ? 'border-blue-200 bg-blue-600 text-white' : 'border-gray-300 bg-white text-gray-600'
          }`}
          title="개발 서버에서만 보이는 버튼입니다"
        >
          <Pencil size={13} />
          {enabled ? '편집 모드 켜짐' : '편집 모드 꺼짐'}
        </button>
        {enabled && (
          <button
            type="button"
            onClick={openMeta}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <FileText size={13} />글 정보
          </button>
        )}
      </div>

      {enabled && !editing && !meta && hovered && hoverBox && (
        <div
          className="pointer-events-none absolute z-40 rounded-md ring-2 ring-blue-400/60"
          style={{ top: hoverBox.top - 4, left: hoverBox.left - 6, width: hoverBox.width + 12, height: hoverBox.height + 8 }}
        >
          <div className="pointer-events-auto absolute -right-3 -top-3 flex gap-1">
            <button
              type="button"
              onClick={() => open(hovered)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow hover:bg-blue-700"
              aria-label="이 블록 편집"
              title="편집 (더블클릭해도 열립니다)"
            >
              <Pencil size={13} />
            </button>
            <button
              type="button"
              onClick={() => open(hovered, true)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-600 shadow hover:bg-blue-50"
              aria-label="아래에 블록 추가"
              title="아래에 블록 추가"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      )}

      {enabled && !editing && !meta && metaBox && (
        <div
          className="pointer-events-none absolute z-40 rounded-md ring-2 ring-blue-400/60"
          style={{ top: metaBox.top - 4, left: metaBox.left - 6, width: metaBox.width + 12, height: metaBox.height + 8 }}
        >
          <button
            type="button"
            onClick={openMeta}
            className="pointer-events-auto absolute -right-3 -top-3 inline-flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-1 text-xs font-medium text-white shadow hover:bg-blue-700"
            title="제목, 요약, 설명, 태그, 날짜 편집 (더블클릭해도 열립니다)"
          >
            <Pencil size={12} />글 정보 편집
          </button>
        </div>
      )}

      {editing && (
        <div
          className="absolute z-50 rounded-lg border border-blue-300 bg-white shadow-xl"
          style={{ top: editorTop, left: editing.box.left - 12, width: editing.box.width + 24 }}
        >
          <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-100 px-2 py-1.5">
            {dropdown(
              'type',
              '블록 종류',
              LINE_TYPES.map((t) => (
                <button key={t.label} type="button" className={menuItem} onMouseDown={keepSelection} onClick={() => setLineType(t.prefix)}>
                  {t.label}
                </button>
              )),
            )}
            <span className="mx-1 h-4 w-px bg-gray-200" />
            <button type="button" className={tool} onMouseDown={keepSelection} onClick={() => wrap('**', '**', '굵게')} title="굵게 (⌘B)">
              <Bold size={13} /> 굵게
            </button>
            <button type="button" className={tool} onMouseDown={keepSelection} onClick={() => wrap('`', '`', 'code')} title="코드 (⌘E)">
              <Code size={13} /> 코드
            </button>
            <button
              type="button"
              className={tool}
              onMouseDown={keepSelection}
              onClick={() => wrap('[', '](https://)', '링크', 'https://')}
              title="링크 (⌘K)"
            >
              <LinkIcon size={13} /> 링크
            </button>
            {dropdown(
              'color',
              <>
                <Palette size={13} /> 색상
              </>,
              COLORS.map((c) => (
                <button
                  key={c.tag}
                  type="button"
                  className={`${menuItem} font-semibold ${c.className}`}
                  onMouseDown={keepSelection}
                  onClick={() => wrap(`<${c.tag}>`, `</${c.tag}>`, '텍스트')}
                >
                  {c.label}
                </button>
              )),
            )}
            <button type="button" className={tool} onMouseDown={keepSelection} onClick={() => wrap('', ' <br />', '')} title="줄바꿈 태그">
              <CornerDownLeft size={13} /> 줄바꿈
            </button>
            <span className="mx-1 h-4 w-px bg-gray-200" />
            {dropdown(
              'insert',
              <>
                <Plus size={13} /> 삽입
              </>,
              <>
                {BLOCKS.map((b) => (
                  <button key={b.label} type="button" className={menuItem} onMouseDown={keepSelection} onClick={() => insertBlock(b.text, b.select)}>
                    {b.label}
                  </button>
                ))}
                <div className="my-1 border-t border-gray-100" />
                <p className="px-3 pb-1 pt-0.5 text-[11px] text-gray-400">패널</p>
                {PANELS.map((p) => (
                  <button
                    key={p.type}
                    type="button"
                    className={menuItem}
                    onMouseDown={keepSelection}
                    onClick={() => insertBlock(`:::${p.type}\n내용\n:::`, '내용')}
                  >
                    {p.label} <span className="text-gray-400">{p.type}</span>
                  </button>
                ))}
              </>,
            )}
            <span className="ml-auto text-[11px] text-gray-400">⌘Enter 저장, Esc 취소</span>
          </div>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => setMenu(null)}
            placeholder={editing.insert ? '새 블록 내용을 입력하세요. 위 삽입 메뉴로 코드 블록, 패널, 탭, 표를 넣을 수 있습니다.' : ''}
            spellCheck={false}
            className="block min-h-[5rem] w-full resize-none border-0 bg-white px-3 py-2 font-mono text-[13px] leading-6 text-gray-800 outline-none"
          />
          <div className="flex items-center gap-2 border-t border-gray-100 px-3 py-2">
            {!editing.insert && (
              <button
                type="button"
                onClick={remove}
                className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs ${
                  confirmDelete ? 'bg-red-600 text-white hover:bg-red-700' : 'text-red-600 hover:bg-red-50'
                }`}
              >
                <Trash2 size={12} />
                {confirmDelete ? '한 번 더 누르면 삭제' : '블록 삭제'}
              </button>
            )}
            {error && <span className="text-xs text-red-600">{error}</span>}
            <button type="button" onClick={reset} className="ml-auto rounded px-3 py-1 text-xs text-gray-600 hover:bg-gray-100">
              취소
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving && <Loader2 size={12} className="animate-spin" />}
              {editing.insert ? '추가' : '저장'}
            </button>
          </div>
        </div>
      )}

      {meta && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 p-4" onMouseDown={(e) => e.target === e.currentTarget && reset()}>
          <form
            className="max-h-[90vh] w-full max-w-2xl space-y-3 overflow-y-auto rounded-xl bg-white p-5 shadow-2xl"
            onKeyDown={(e) => e.key === 'Escape' && reset()}
            onSubmit={(e) => {
              e.preventDefault();
              post({ kind: 'meta', fields: meta });
            }}
          >
            <h2 className="text-base font-semibold text-gray-900">글 정보</h2>
            {(
              [
                ['title', '제목'],
                ['summary', '요약 (summary, 목록 카드)'],
                ['description', '설명 (description, 검색 결과)'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block text-xs text-gray-500">
                {label}
                {/* 내용 길이에 맞춰 높이가 늘어나서 긴 요약, 설명도 잘리지 않는다. */}
                <textarea
                  value={meta[key]}
                  rows={key === 'title' ? 1 : 3}
                  spellCheck={false}
                  onChange={(e) => setMeta({ ...meta, [key]: e.target.value.replace(/\n/g, ' ') })}
                  className="mt-1 block w-full resize-none rounded-md border border-gray-300 px-2.5 py-1.5 text-sm leading-6 text-gray-800 [field-sizing:content] focus:border-blue-400 focus:outline-none"
                />
              </label>
            ))}
            <label className="block text-xs text-gray-500">
              태그 (쉼표로 구분)
              <input
                value={meta.tags.join(', ')}
                onChange={(e) => setMeta({ ...meta, tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm text-gray-800 focus:border-blue-400 focus:outline-none"
              />
            </label>
            <div className="flex gap-3">
              {(
                [
                  ['date', '작성일'],
                  ['updated', '수정일 (비우면 표시 안 함)'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="block flex-1 text-xs text-gray-500">
                  {label}
                  <input
                    type="date"
                    value={meta[key]}
                    onChange={(e) => setMeta({ ...meta, [key]: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm text-gray-800 focus:border-blue-400 focus:outline-none"
                  />
                </label>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              {error && <span className="text-xs text-red-600">{error}</span>}
              <button type="button" onClick={reset} className="ml-auto rounded px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100">
                취소
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving && <Loader2 size={12} className="animate-spin" />}
                저장
              </button>
            </div>
          </form>
        </div>
      )}
    </>,
    document.body,
  );
}
