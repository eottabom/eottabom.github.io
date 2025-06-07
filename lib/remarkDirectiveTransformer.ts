import { visit } from 'unist-util-visit';
import { Plugin } from 'unified';
import { ContainerDirective } from 'mdast-util-directive';
import { Node } from 'unist';

const remarkDirectiveTransformer: Plugin = () => {
  return (tree: Node) => {
    visit(tree, (node: Node) => {
      if ((node as ContainerDirective).type === 'containerDirective') {
        const container = node as ContainerDirective;

        if (!container.data) container.data = {};
        container.data.hName = container.name;
        container.data.hProperties = container.attributes || {};
      }
    });
  };
};

export default remarkDirectiveTransformer;
