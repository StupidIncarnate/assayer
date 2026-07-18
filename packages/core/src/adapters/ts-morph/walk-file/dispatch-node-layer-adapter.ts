/**
 * PURPOSE: THE registry — the single place that answers "does anyone handle this node?". Every node
 *   the walk reaches passes through here exactly once, and every syntax family the analyzer learns
 *   is routed here and nowhere else. This is the ONLY file that names SyntaxKinds.
 *
 *   The default branch is the important one. A node no handler claims still gets DESCENDED (its
 *   contents are never lost — a `return` inside an unhandled `for` is still found), and if its kind
 *   is semantically load-bearing it is recorded as unhandled, which projects to a DARK SPOT. Silence
 *   is not an option here: a map that drops a flow it could not follow reads as complete and gets
 *   trusted, which is worse than having no map at all.
 *
 * USAGE:
 * dispatchNodeLayerAdapter({ node, context });
 * // Returns { branches, exits, nodes, descents, opensScope? } — never recurses itself
 */
import { Node } from 'ts-morph';

import type { WalkContext } from '../../../contracts/walk-context/walk-context-contract';
import { walkNodeContract } from '../../../contracts/walk-node/walk-node-contract';
import { significantSyntaxKindsStatics } from '../../../statics/significant-syntax-kinds/significant-syntax-kinds-statics';
import { handleBlockLayerAdapter } from './handle-block-layer-adapter';
import { handleCallLayerAdapter } from './handle-call-layer-adapter';
import { handleClassLayerAdapter } from './handle-class-layer-adapter';
import { handleExitLayerAdapter } from './handle-exit-layer-adapter';
import { handleFunctionLayerAdapter } from './handle-function-layer-adapter';
import { handleIfLayerAdapter } from './handle-if-layer-adapter';
import { handleSourceFileLayerAdapter } from './handle-source-file-layer-adapter';
import { handleSwitchLayerAdapter } from './handle-switch-layer-adapter';
import { handlerResultLayerAdapter } from './handler-result-layer-adapter';

export const dispatchNodeLayerAdapter = ({
  node,
  context,
}: {
  node: Node;
  context: WalkContext;
}): ReturnType<typeof handlerResultLayerAdapter> => {
  if (Node.isSourceFile(node)) {
    return handleSourceFileLayerAdapter({ node, context });
  }

  if (Node.isClassDeclaration(node) || Node.isClassExpression(node)) {
    return handleClassLayerAdapter({ node, context });
  }

  if (
    Node.isFunctionDeclaration(node) ||
    Node.isArrowFunction(node) ||
    Node.isFunctionExpression(node) ||
    Node.isMethodDeclaration(node) ||
    Node.isConstructorDeclaration(node) ||
    Node.isGetAccessorDeclaration(node) ||
    Node.isSetAccessorDeclaration(node)
  ) {
    return handleFunctionLayerAdapter({ node, context });
  }

  if (Node.isIfStatement(node)) {
    return handleIfLayerAdapter({ node, context });
  }

  if (Node.isSwitchStatement(node)) {
    return handleSwitchLayerAdapter({ node, context });
  }

  if (Node.isReturnStatement(node) || Node.isThrowStatement(node)) {
    return handleExitLayerAdapter({ node, context });
  }

  // A bare block (not a scope body) still sequences statements, so early-return guards survive it.
  if (Node.isBlock(node)) {
    return handleBlockLayerAdapter({ statements: node.getStatements(), context });
  }

  // A call is a use-def EDGE, not a scope: it records who it links to and descends its children so
  // nothing inside the callee expression or arguments is dropped.
  if (Node.isCallExpression(node)) {
    return handleCallLayerAdapter({ node, context });
  }

  const kindName = node.getKindName();
  const significant = significantSyntaxKindsStatics.kinds.some((kind) => kind === kindName);

  return handlerResultLayerAdapter({
    nodes: significant
      ? [
          walkNodeContract.parse({
            kind: kindName,
            scopePath: context.scopePath,
            startLine: node.getStartLineNumber(),
            endLine: node.getEndLineNumber(),
            handled: false,
          }),
        ]
      : [],
    descents: node.forEachChildAsArray().map((child) => ({ node: child, context })),
  });
};
