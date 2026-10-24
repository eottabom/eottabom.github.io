// 개발 서버 전용. 본문 최상위 블록(문단, 제목, 목록, 표, 코드, 패널, 탭 같은 JSX 블록)에 원문 위치를 data-src="시작-끝" 으로 남긴다.
// 글 화면에서 블록을 눌러 바로 고칠 때(components/DevEditor.tsx), 이 위치로 mdx 파일의 해당 부분만 바꾼다.
const EDITABLE = new Set(['paragraph', 'heading', 'list', 'table', 'code', 'blockquote', 'containerDirective']);

export default function remarkSourceRange() {
  return (tree: any) => {
    for (const node of tree.children ?? []) {
      if (!node.position) continue;
      const range = `${node.position.start.offset}-${node.position.end.offset}`;

      if (EDITABLE.has(node.type)) {
        node.data = node.data ?? {};
        node.data.hProperties = { ...(node.data.hProperties ?? {}), dataSrc: range };
      } else if (node.type === 'mdxJsxFlowElement') {
        // <Tabs>, <div style=...> 같은 JSX 블록은 속성으로 넘긴다. 컴포넌트가 data-src 를 그려야 편집할 수 있다.
        node.attributes = [...(node.attributes ?? []), { type: 'mdxJsxAttribute', name: 'data-src', value: range }];
      }
    }
  };
}
