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
 * dispatchNodeLayerTransformer({ node, context });
 * // Returns { branches, exits, nodes, descents, opensScope? } — never recurses itself
 */
import { Node } from '#gateway/npm/ts-morph';

import type { WalkContext } from '../../contracts/walk-context/walk-context-contract';
import { walkNodeContract } from '../../contracts/walk-node/walk-node-contract';
import { significantSyntaxKindsStatics } from '../../statics/significant-syntax-kinds/significant-syntax-kinds-statics';
import { handleBlockLayerTransformer } from './handle-block-layer-transformer';
import { handleCallLayerTransformer } from './handle-call-layer-transformer';
import { handleClassLayerTransformer } from './handle-class-layer-transformer';
import { handleDynamicImportLayerTransformer } from './handle-dynamic-import-layer-transformer';
import { handleExitLayerTransformer } from './handle-exit-layer-transformer';
import { handleExportLayerTransformer } from './handle-export-layer-transformer';
import { handleFunctionLayerTransformer } from './handle-function-layer-transformer';
import { handleIfLayerTransformer } from './handle-if-layer-transformer';
import { handleImportLayerTransformer } from './handle-import-layer-transformer';
import { handleMemberAccessLayerTransformer } from './handle-member-access-layer-transformer';
import { handleSourceFileLayerTransformer } from './handle-source-file-layer-transformer';
import { handleSwitchLayerTransformer } from './handle-switch-layer-transformer';
import { handleTypeDeclarationLayerTransformer } from './handle-type-declaration-layer-transformer';
import { handleVariableLayerTransformer } from './handle-variable-layer-transformer';
import { handlerResultLayerTransformer } from './handler-result-layer-transformer';

export const dispatchNodeLayerTransformer = ({
  node,
  context,
}: {
  node: Node;
  context: WalkContext;
}): ReturnType<typeof handlerResultLayerTransformer> => {
  if (Node.isSourceFile(node)) {
    return handleSourceFileLayerTransformer({ node, context });
  }

  if (Node.isClassDeclaration(node) || Node.isClassExpression(node)) {
    return handleClassLayerTransformer({ node, context });
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
    return handleFunctionLayerTransformer({ node, context });
  }

  if (Node.isIfStatement(node)) {
    return handleIfLayerTransformer({ node, context });
  }

  if (Node.isSwitchStatement(node)) {
    return handleSwitchLayerTransformer({ node, context });
  }

  if (Node.isReturnStatement(node) || Node.isThrowStatement(node)) {
    return handleExitLayerTransformer({ node, context });
  }

  // A bare block (not a scope body) still sequences statements, so early-return guards survive it.
  if (Node.isBlock(node)) {
    return handleBlockLayerTransformer({ statements: node.getStatements(), context });
  }

  // A dynamic `import()` is a MODULE edge, not a call: its argument names the module (or, when the
  // argument is not a literal, names nothing the parse can read). Route it before the generic call
  // route so it records an edge rather than an unresolved call.
  if (Node.isCallExpression(node) && Node.isImportExpression(node.getExpression())) {
    return handleDynamicImportLayerTransformer({ node, context });
  }

  // A call is a use-def EDGE, not a scope: it records who it links to and descends its children so
  // nothing inside the callee expression or arguments is dropped.
  if (Node.isCallExpression(node)) {
    return handleCallLayerTransformer({ node, context });
  }

  // An import/re-export is a MODULE edge: it records the specifier and bindings as a flat file-level
  // fact and opens no scope. Together these are the raw half of the cross-file graph.
  if (Node.isImportDeclaration(node)) {
    return handleImportLayerTransformer({ node, context });
  }

  if (Node.isExportDeclaration(node)) {
    return handleExportLayerTransformer({ node, context });
  }

  // A property access `root.member` records an ambient-external GLOBAL use when `root` is a free name
  // the hermetic walk cannot type (`console.log`, `process.env`) — the ambient half of the cross-file
  // graph a later stitch resolves. A non-ambient access records nothing and simply descends, exactly
  // as the default branch would.
  if (Node.isPropertyAccessExpression(node)) {
    return handleMemberAccessLayerTransformer({ node, context });
  }

  // An `interface`/`type`/`enum` declaration records the SHAPE it declares as a flat file-level fact.
  // It is read off the declaration rather than off the signatures that mention it, so a shape only a
  // sibling's reader ever names is still part of this file's declared surface. An enum belongs here
  // because a reader typed `Level` demands exactly what the enum's members enumerate — the same
  // question an alias to a literal union asks, and the same reader answers it.
  if (Node.isInterfaceDeclaration(node) || Node.isTypeAliasDeclaration(node) || Node.isEnumDeclaration(node)) {
    return handleTypeDeclarationLayerTransformer({ node, context });
  }

  // A variable statement records a VALUE USE when an initializer references an existing binding
  // (`const separator = sep`) — a data flow that is not a call, on its own channel — and descends its
  // children so a function or branch inside an initializer is still found.
  if (Node.isVariableStatement(node)) {
    return handleVariableLayerTransformer({ node, context });
  }

  const kindName = node.getKindName();
  const significant = significantSyntaxKindsStatics.kinds.some((kind) => kind === kindName);

  return handlerResultLayerTransformer({
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
