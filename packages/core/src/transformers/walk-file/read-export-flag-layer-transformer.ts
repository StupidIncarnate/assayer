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
 *   A function stored as a property of an exported object is reachable too, because an importer can
 *   call it off that object. `read-object-member-access` answers that shape, the same reader
 *   `read-entry-access` asks, so reach and access agree.
 *
 *   Reach is read off the module's RESOLVED export table, not off the `export` keyword on the
 *   declaration: `const runIt = …; export default runIt;` and `export { runIt };` export the function
 *   just as surely as `export const runIt`, and the statement that says so sits elsewhere in the file.
 *
 * USAGE:
 * readExportFlagLayerTransformer({ node: arrowFunction, context });
 * // Returns true for `export const classify = () => …`, false for a nested helper
 */
import { Node } from '#gateway/npm/ts-morph';

import type { WalkContext } from '../../contracts/walk-context/walk-context-contract';
import { readModuleExportLayerTransformer } from './read-module-export-layer-transformer';
import { readObjectMemberAccessLayerTransformer } from './read-object-member-access-layer-transformer';

export const readExportFlagLayerTransformer = ({ node, context }: { node: Node; context: WalkContext }): boolean => {
  if (readObjectMemberAccessLayerTransformer({ node }) !== undefined) {
    return true;
  }

  if (
    Node.isMethodDeclaration(node) ||
    Node.isConstructorDeclaration(node) ||
    Node.isGetAccessorDeclaration(node) ||
    Node.isSetAccessorDeclaration(node)
  ) {
    return context.exported;
  }

  const parent = node.getParent();

  // `export default () => …` — the arrow hangs off the export assignment, so it is the export itself
  // rather than a declaration the export table names.
  if (Node.isExportAssignment(parent)) {
    return true;
  }

  return readModuleExportLayerTransformer({ node }) !== undefined;
};
