/**
 * PURPOSE: Reads the name a function-like contributes to the scope path. Declarations, methods and
 *   accessors carry their own; an arrow or function expression borrows the binding it is assigned to
 *   (`const classify = () => …`, `handleClick = () => …`, `{ onSave: () => … }`), and a default
 *   export is `default`.
 *
 *   A genuinely anonymous function — a callback like `items.map((x) => …)` — falls back to its
 *   STRUCTURAL PROJECTION, never a line or an index. That matters: a name is a coverage-ID segment,
 *   so a positional fallback would move the ID when the callback moved, and an index would move it
 *   when a sibling was reordered. A projection moves only when the callback's own logic changes.
 *
 *   That fallback travels as `anonymous`, because a projection is a key and no surface may print one.
 *   Whoever needs a readable label for such a scope must know it has none, and this is the only place
 *   that knows — reading it back off the returned name would mean matching the `fn:` prefix, which is
 *   deriving a fact from the SPELLING of an identity string.
 *
 * USAGE:
 * readFunctionNameLayerAdapter({ node: arrowFunction });
 * // Returns { name: 'classify', anonymous: false }, or a structural projection with anonymous: true
 */
import { Node } from 'ts-morph';

import { symbolNameContract } from '@assayer/shared/contracts';
import type { SymbolName } from '@assayer/shared/contracts';

import { projectNodeLayerAdapter } from './project-node-layer-adapter';

export const readFunctionNameLayerAdapter = ({ node }: { node: Node }): { name: SymbolName; anonymous: boolean } => {
  if (Node.isConstructorDeclaration(node)) {
    return { name: symbolNameContract.parse('constructor'), anonymous: false };
  }

  if (
    Node.isFunctionDeclaration(node) ||
    Node.isMethodDeclaration(node) ||
    Node.isGetAccessorDeclaration(node) ||
    Node.isSetAccessorDeclaration(node) ||
    Node.isFunctionExpression(node)
  ) {
    const own = node.getName();
    if (own !== undefined && own.length > 0) {
      return { name: symbolNameContract.parse(own), anonymous: false };
    }
  }

  const parent = node.getParent();

  if (Node.isVariableDeclaration(parent) || Node.isPropertyDeclaration(parent) || Node.isPropertyAssignment(parent)) {
    return { name: symbolNameContract.parse(parent.getName()), anonymous: false };
  }

  if (Node.isExportAssignment(parent)) {
    return { name: symbolNameContract.parse('default'), anonymous: false };
  }

  return { name: symbolNameContract.parse(`fn:${projectNodeLayerAdapter({ node })}`), anonymous: true };
};
