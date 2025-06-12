import { visit } from 'unist-util-visit';
import { Plugin } from 'unified';
import { ContainerDirective } from 'mdast-util-directive';
import { Node } from 'unist';

const remarkDirectiveTransformer: Plugin = () => {
  return (tree: Node) => {
    visit(tree, (node: Node) => {
      if ((node as unknown as ContainerDirective).type === 'containerDirective') {
        const container = node as unknown as ContainerDirective;

        if (!container.data) container.data = {};
        (container.data as any).hName = container.name;
        (container.data as any).hProperties = container.attributes || {};
      }
    });
  };
};

export default remarkDirectiveTransformer;
