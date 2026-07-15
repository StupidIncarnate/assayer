/**
 * PURPOSE: Reports whether a function-like is reachable from outside its module — the fact that
 *   decides whether it is an analysable entry or merely walked. Reach is NOT simply inherited: a
 *   class member inherits its class's reach (an exported class's method is callable), while a
 *   function nested inside an exported function does NOT (nobody outside can call it), so the walk
 *   hands `exported: false` down into every function body and this consults only the node's own
 *   declaration plus, for members, the class around it.
 *
 *   That distinction is why a nested helper is FOUND and recorded without becoming a fake entry
 *   that derived cases would try to drive directly.
 *
 * USAGE:
 * readExportFlagLayerAdapter({ node: arrowFunction, context });
 * // Returns true for `export const classify = () => …`, false for a nested helper
 */
import { Node } from 'ts-morph';

import type { WalkContext } from '../../../contracts/walk-context/walk-context-contract';

export const readExportFlagLayerAdapter = ({ node, context }: { node: Node; context: WalkContext }): boolean => {
  if (
    Node.isMethodDeclaration(node) ||
    Node.isConstructorDeclaration(node) ||
    Node.isGetAccessorDeclaration(node) ||
    Node.isSetAccessorDeclaration(node)
  ) {
    return context.exported;
  }

  if (Node.isFunctionDeclaration(node)) {
    return node.isExported();
  }

  const parent = node.getParent();

  if (Node.isExportAssignment(parent)) {
    return true;
  }

  if (Node.isVariableDeclaration(parent)) {
    return parent.getVariableStatement()?.isExported() === true;
  }

  return false;
};
