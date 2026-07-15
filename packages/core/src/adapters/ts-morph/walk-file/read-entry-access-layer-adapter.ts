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
 * USAGE:
 * readEntryAccessLayerAdapter({ node: methodDeclaration, context });
 * // Returns { kind: 'method', className: 'Classifier', constructable: true }
 */
import { Node } from 'ts-morph';

import { entryAccessContract } from '@assayer/shared/contracts';
import type { EntryAccess } from '@assayer/shared/contracts';

import type { WalkContext } from '../../../contracts/walk-context/walk-context-contract';

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

  if (Node.isFunctionDeclaration(node)) {
    return entryAccessContract.parse(
      node.isDefaultExport() ? { kind: 'default' } : node.isExported() ? { kind: 'named' } : { kind: 'unreachable' },
    );
  }

  const parent = node.getParent();

  // `export default () => …` — the arrow hangs off the export assignment itself.
  if (Node.isExportAssignment(parent)) {
    return entryAccessContract.parse({ kind: 'default' });
  }

  if (Node.isVariableDeclaration(parent)) {
    return entryAccessContract.parse(
      parent.getVariableStatement()?.isExported() === true ? { kind: 'named' } : { kind: 'unreachable' },
    );
  }

  return entryAccessContract.parse({ kind: 'unreachable' });
};
