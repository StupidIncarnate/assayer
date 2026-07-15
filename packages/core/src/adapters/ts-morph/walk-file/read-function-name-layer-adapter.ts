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
 * USAGE:
 * readFunctionNameLayerAdapter({ node: arrowFunction });
 * // Returns 'classify' (branded SymbolName), or a structural projection when anonymous
 */
import { Node } from 'ts-morph';

import { symbolNameContract } from '@assayer/shared/contracts';
import type { SymbolName } from '@assayer/shared/contracts';

import { projectNodeLayerAdapter } from './project-node-layer-adapter';

export const readFunctionNameLayerAdapter = ({ node }: { node: Node }): SymbolName => {
  if (Node.isConstructorDeclaration(node)) {
    return symbolNameContract.parse('constructor');
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
      return symbolNameContract.parse(own);
    }
  }

  const parent = node.getParent();

  if (Node.isVariableDeclaration(parent) || Node.isPropertyDeclaration(parent) || Node.isPropertyAssignment(parent)) {
    return symbolNameContract.parse(parent.getName());
  }

  if (Node.isExportAssignment(parent)) {
    return symbolNameContract.parse('default');
  }

  return symbolNameContract.parse(`fn:${projectNodeLayerAdapter({ node })}`);
};
