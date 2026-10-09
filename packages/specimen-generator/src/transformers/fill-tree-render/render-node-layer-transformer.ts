/**
 * PURPOSE: Renders one fill tree into a node, and records the parameters and declarations its leaves
 * need in the maps it is given. A leaf is its own expression. A shim node is a call. Any other node is
 * its syntax's code with each hole swapped for its fill, where a statement syntax gives a block and an
 * expression syntax gives an expression without the parentheses that wrap its whole body. Each hole's fill is rendered in the order the syntax declares
 * its holes, so a name is claimed in that order. A nested node is printed and parsed again before it is
 * placed, so no node from another syntax's source file ends up inside this one. Reach for this over
 * fillTreeRenderTransformer only to render a subtree into maps the caller owns.
 *
 * USAGE:
 * renderNodeLayerTransformer({ tree, armKind: 'return', names: new Map(), params: new Map(), decls: new Map() });
 * // Returns the focus code as a node
 */
import ts from '#gateway/npm/typescript';

import type { FillTree } from '../../contracts/fill-tree/fill-tree-contract';
import { leafLayerTransformer } from './leaf-layer-transformer';
import { parseSnippetExpressionTransformer } from '../parse-snippet-expression/parse-snippet-expression-transformer';
import { shimCallLayerTransformer } from './shim-call-layer-transformer';
import { swapHolesLayerTransformer } from './swap-holes-layer-transformer';

export const renderNodeLayerTransformer = ({
  tree,
  armKind,
  names,
  params,
  decls,
}: {
  tree: FillTree;
  armKind?: 'log' | 'return' | 'yield' | undefined;
  names: Map<FillTree, string>;
  params: Map<string, string>;
  decls: Map<string, string>;
}): ts.ConciseBody => {
  if (tree.kind === 'leaf') {
    return leafLayerTransformer({ leaf: tree, names, params, decls });
  }

  const { instance } = tree;
  const printer = ts.createPrinter({ removeComments: true });
  const entries = instance.holes.map(({ name }): [string, ts.Expression] => {
    const child = tree.holes[name];
    if (child === undefined) {
      throw new Error(
        `The node '${instance.label}' has no fill for its hole '${name}'. Give every hole of the node a leaf or a node.`,
      );
    }
    if (child.kind === 'leaf') {
      return [name, leafLayerTransformer({ leaf: child, names, params, decls })];
    }
    const rendered = renderNodeLayerTransformer({ tree: child, names, params, decls });
    if (ts.isBlock(rendered)) {
      throw new Error(
        `The node '${child.instance.label}' is a statement, so it cannot fill the hole '${name}' of '${instance.label}'. A statement never fills a hole.`,
      );
    }

    return [
      name,
      parseSnippetExpressionTransformer({
        text: printer.printNode(ts.EmitHint.Unspecified, rendered, child.instance.syntax.sourceFile),
      }),
    ];
  });

  if (instance.syntax.origin === 'shim') {
    return shimCallLayerTransformer({ instance, fills: entries.map(([, expression]) => expression) });
  }

  const body = ts.visitNode(
    instance.syntax.arrow.body,
    (child) => swapHolesLayerTransformer({ node: child, instance, fills: new Map(entries), armKind }),
    ts.isConciseBody,
  );

  if (body === undefined) {
    throw new Error(
      `The code of the syntax '${instance.label}' has no body left after its holes were swapped. Report this as a generator bug.`,
    );
  }

  return ts.isParenthesizedExpression(body) ? body.expression : body;
};
