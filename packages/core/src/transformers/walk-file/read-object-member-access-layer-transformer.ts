/**
 * PURPOSE: Reads whether a function-like is stored as a property of an object the module exports
 *   (`export const api = { run() {…} }`, `export default { run: () => … }`), and if so, how a caller
 *   outside the module reaches it: the module property that holds the object, plus the object's own
 *   property that holds the function. `read-entry-access` and `read-export-flag` both ask this one
 *   reader, so the two can never disagree about whether such a function is reachable.
 *
 *   An importer can call a function it finds on an exported object, so the function is surface, not a
 *   private helper. Reading it as unreachable would lint correct code as dead surface.
 *
 *   It reads only the syntax that holds the function: the property that holds it, the object literal
 *   that holds that property, and the declaration or `export default` that holds the object. An
 *   `as`, `satisfies` or parenthesis around the object is looked through, because it changes nothing
 *   at run time. The export itself is answered by the module's resolved export table, the same way
 *   `read-module-export` answers it for a function.
 *
 *   The property key comes from the checker's own symbol for the property, so `'run'`, `"run"` and
 *   `run` all read as `run`. A computed key (`[name]: …`) names no property the analysis can know, so
 *   it reads as no object member at all. A getter or a setter carries `accessor`, because the runner
 *   reads or assigns such a property instead of calling it.
 *
 * USAGE:
 * readObjectMemberAccessLayerTransformer({ node: arrowFunction });
 * // Returns { kind: 'object-member', objectName: 'api', property: 'run' } for
 * // `export const api = { run: () => … }`, and undefined for anything else
 */
import { Node } from '#gateway/npm/ts-morph';

import { entryAccessContract } from '@assayer/shared/contracts';
import type { EntryAccess } from '@assayer/shared/contracts';

import { readModuleExportLayerTransformer } from './read-module-export-layer-transformer';

// The one name TypeScript's export table gives a default export, under every spelling of it.
const DEFAULT_EXPORT_NAME = 'default';

export const readObjectMemberAccessLayerTransformer = ({ node }: { node: Node }): EntryAccess | undefined => {
  const parent = node.getParent();
  // The node that names the property: the property assignment around an arrow or function
  // expression, or the method or accessor itself, which is its own property.
  const member =
    Node.isMethodDeclaration(node) || Node.isGetAccessorDeclaration(node) || Node.isSetAccessorDeclaration(node)
      ? node
      : Node.isPropertyAssignment(parent) && parent.getInitializer() === node
        ? parent
        : undefined;
  const object = member?.getParent();

  if (member === undefined || !Node.isObjectLiteralExpression(object) || Node.isComputedPropertyName(member.getNameNode())) {
    return undefined;
  }

  const property = member.getSymbol()?.getName();
  // `as const`, `satisfies Api` and parentheses wrap the object without changing what the module holds.
  const wrapped =
    object.getParentWhile(
      (wrapper) =>
        Node.isAsExpression(wrapper) || Node.isSatisfiesExpression(wrapper) || Node.isParenthesizedExpression(wrapper),
    ) ?? object;
  const holder = wrapped.getParent();
  // `export default { … }` hangs the object off the export assignment itself. `export = { … }` makes the
  // object the module, which is not a property of anything, so it is not read here.
  const objectName =
    Node.isExportAssignment(holder) && !holder.isExportEquals()
      ? DEFAULT_EXPORT_NAME
      : readModuleExportLayerTransformer({ node: wrapped });

  if (property === undefined || objectName === undefined) {
    return undefined;
  }

  const accessor = Node.isGetAccessorDeclaration(node) ? 'get' : Node.isSetAccessorDeclaration(node) ? 'set' : undefined;

  return entryAccessContract.parse({
    kind: 'object-member',
    objectName,
    property,
    ...(accessor === undefined ? {} : { accessor }),
  });
};
