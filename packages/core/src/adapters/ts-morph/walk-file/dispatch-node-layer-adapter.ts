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
import { handleDynamicImportLayerAdapter } from './handle-dynamic-import-layer-adapter';
import { handleExitLayerAdapter } from './handle-exit-layer-adapter';
import { handleExportLayerAdapter } from './handle-export-layer-adapter';
import { handleFunctionLayerAdapter } from './handle-function-layer-adapter';
import { handleIfLayerAdapter } from './handle-if-layer-adapter';
import { handleImportLayerAdapter } from './handle-import-layer-adapter';
import { handleMemberAccessLayerAdapter } from './handle-member-access-layer-adapter';
import { handleSourceFileLayerAdapter } from './handle-source-file-layer-adapter';
import { handleSwitchLayerAdapter } from './handle-switch-layer-adapter';
import { handleVariableLayerAdapter } from './handle-variable-layer-adapter';
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

  // A dynamic `import()` is a MODULE edge, not a call: its argument names the module (or, when the
  // argument is not a literal, names nothing the parse can read). Route it before the generic call
  // route so it records an edge rather than an unresolved call.
  if (Node.isCallExpression(node) && Node.isImportExpression(node.getExpression())) {
    return handleDynamicImportLayerAdapter({ node, context });
  }

  // A call is a use-def EDGE, not a scope: it records who it links to and descends its children so
  // nothing inside the callee expression or arguments is dropped.
  if (Node.isCallExpression(node)) {
    return handleCallLayerAdapter({ node, context });
  }

  // An import/re-export is a MODULE edge: it records the specifier and bindings as a flat file-level
  // fact and opens no scope. Together these are the raw half of the cross-file graph.
  if (Node.isImportDeclaration(node)) {
    return handleImportLayerAdapter({ node, context });
  }

  if (Node.isExportDeclaration(node)) {
    return handleExportLayerAdapter({ node, context });
  }

  // A property access `root.member` records an ambient-external GLOBAL use when `root` is a free name
  // the hermetic walk cannot type (`console.log`, `process.env`) — the ambient half of the cross-file
  // graph a later stitch resolves. A non-ambient access records nothing and simply descends, exactly
  // as the default branch would.
  if (Node.isPropertyAccessExpression(node)) {
    return handleMemberAccessLayerAdapter({ node, context });
  }

  // A variable statement records a VALUE USE when an initializer references an existing binding
  // (`const separator = sep`) — a data flow that is not a call, on its own channel — and descends its
  // children so a function or branch inside an initializer is still found.
  if (Node.isVariableStatement(node)) {
    return handleVariableLayerAdapter({ node, context });
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
