import { visit } from 'unist-util-visit';
import { Plugin } from 'unified';
import { Code, Parent } from 'mdast';
import { Node } from 'unist';

// ```mermaid 코드 블록을 <Mermaid chart="..." /> 로 바꾼다.
// rehype-prism 이 일반 코드처럼 하이라이트하기 전에 바꿔야 해서 remark 단계에서 처리한다.
// remarkSourceRange 보다 앞에 둬야 화면 편집기가 이 블록에도 data-src 를 붙인다.
const remarkMermaid: Plugin = () => {
  return (tree: Node) => {
    visit(tree, 'code', (node: Code, index: number | undefined, parent: Parent | undefined) => {
      if (node.lang !== 'mermaid' || parent == null || index == null) return;

      parent.children[index] = {
        type: 'mdxJsxFlowElement',
        name: 'Mermaid',
        attributes: [{ type: 'mdxJsxAttribute', name: 'chart', value: node.value }],
        children: [],
        position: node.position,
      } as unknown as Code;
    });
  };
};

export default remarkMermaid;
