/**
 * PURPOSE: Reads HOW a caller outside the module reaches this function-like — the fact that makes a
 *   derived case drivable rather than merely described. `read-export-flag` answers whether anything
 *   can reach it; this answers through what.
 *
 *   The class case is why this consults context rather than the node: a method is addressable only
 *   through an instance, and only the class knows its own name and constructability, so the walk
 *   hands both DOWN. Asking the node to find its class would be the ancestor climb the walk exists
 *   to remove.
 *
 *   Anything nothing can call — a nested helper, a module scope — is `unreachable`. That is a fact,
 *   not a failure: it is what lets the runner drop it as a named gap instead of driving it and
 *   reporting the analyzer wrong.
 *
 *   The export forms are answered by the module's RESOLVED export table rather than by the keyword on
 *   the declaration, so `export default runIt`, `export { runIt as default }` and
 *   `export default function runIt` come out the same `default` — they ARE the same export. The table
 *   also carries the exported NAME, which is why a renamed export (`export { runIt as go }`) says so:
 *   the module property is `go`, and a runner reaching for `runIt` would find nothing there.
 *
 * USAGE:
 * readEntryAccessLayerAdapter({ node: methodDeclaration, context });
 * // Returns { kind: 'method', className: 'Classifier', constructable: true }
 */
import { Node } from '#gateway/npm/ts-morph';

import { entryAccessContract } from '@assayer/shared/contracts';
import type { EntryAccess } from '@assayer/shared/contracts';

import type { WalkContext } from '../../../contracts/walk-context/walk-context-contract';
import { readFunctionNameLayerAdapter } from './read-function-name-layer-adapter';
import { readModuleExportLayerAdapter } from './read-module-export-layer-adapter';

// The one name TypeScript's export table gives a default export, under every spelling of it.
const DEFAULT_EXPORT_NAME = 'default';

export const readEntryAccessLayerAdapter = ({ node, context }: { node: Node; context: WalkContext }): EntryAccess => {
  if (Node.isConstructorDeclaration(node)) {
    const owner = context.enclosingClass;

    // Reached through `new`, never as a property — resolving it like a method yields the class, and
    // applying that without `new` throws.
    return entryAccessContract.parse(
      owner === undefined ? { kind: 'unreachable' } : { kind: 'constructor', className: owner.name },
    );
  }

  if (Node.isMethodDeclaration(node) || Node.isGetAccessorDeclaration(node) || Node.isSetAccessorDeclaration(node)) {
    const enclosing = context.enclosingClass;

    return entryAccessContract.parse(
      enclosing === undefined
        ? { kind: 'unreachable' }
        : { kind: 'method', className: enclosing.name, constructable: enclosing.constructable },
    );
  }

  const parent = node.getParent();

  // `export default () => …` — the arrow hangs off the export assignment itself.
  if (Node.isExportAssignment(parent)) {
    return entryAccessContract.parse({ kind: 'default' });
  }

  // Which name the MODULE exports this declaration under, resolved by the checker. It answers every
  // export form at once — the keyword on the declaration, a later `export default runIt`, and an
  // `export { runIt as default }` — because all three land in one export table.
  const exportedName = readModuleExportLayerAdapter({ node });

  if (exportedName === undefined) {
    return entryAccessContract.parse({ kind: 'unreachable' });
  }

  if (String(exportedName) === DEFAULT_EXPORT_NAME) {
    return entryAccessContract.parse({ kind: 'default' });
  }

  const { name } = readFunctionNameLayerAdapter({ node });

  // A named export the module puts under a DIFFERENT property than the local binding
  // (`export { runIt as go }`) carries that property, because the runner lays hands on the entry by
  // reading it off the module and `runIt` is not there.
  return entryAccessContract.parse({
    kind: 'named',
    ...(String(name) === String(exportedName) ? {} : { exportedName }),
  });
};
