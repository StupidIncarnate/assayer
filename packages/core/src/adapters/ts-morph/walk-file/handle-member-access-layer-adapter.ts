/**
 * PURPOSE: Handles a property access `root.member` — records ONE global use as a flat file-level fact
 *   (never scope-claimed, like a module edge) WHEN `root` is an ambient-external identifier the
 *   hermetic walk cannot type (`console`→`log`, `process`→`env`), and nothing at all otherwise. It
 *   opens no scope; a member access binds no name and branches nothing.
 *
 *   The use is the raw, unresolved half of the ambient-external graph — a later stitch resolves the
 *   `name`/`member` against `@types/node`'s global scope. `called` is whether this access is the callee
 *   of a call (`console.log(x)` vs a bare `process.env`), read off the IMMEDIATE parent — the local
 *   syntactic role, not a scope climb — and `args` is the call's structural argument shapes (never a
 *   source value, P4). Only the leftmost access off the root emits: `process.env.MODE` records
 *   `process`→`env` from the inner `process.env` access, whose root is the bare identifier, while the
 *   outer access (whose root is itself an access) contributes nothing.
 *
 *   It descends its children so nested scopes/branches/calls in the object or arguments are still found.
 *
 * USAGE:
 * handleMemberAccessLayerAdapter({ node: propertyAccess, context });
 * // Returns a HandlerResult with one globalUse (or none) and the child descents
 */
import { Node } from 'ts-morph';
import type { PropertyAccessExpression } from 'ts-morph';

import { globalUseContract } from '@assayer/shared/contracts';

import type { WalkContext } from '../../../contracts/walk-context/walk-context-contract';
import { handlerResultLayerAdapter } from './handler-result-layer-adapter';
import { readAmbientRootLayerAdapter } from './read-ambient-root-layer-adapter';
import { readCallArgsLayerAdapter } from './read-call-args-layer-adapter';

export const handleMemberAccessLayerAdapter = ({
  node,
  context,
}: {
  node: PropertyAccessExpression;
  context: WalkContext;
}): ReturnType<typeof handlerResultLayerAdapter> => {
  const root = node.getExpression();
  const descents = node.forEachChildAsArray().map((child) => ({ node: child, context }));

  if (!readAmbientRootLayerAdapter({ node: root })) {
    return handlerResultLayerAdapter({ descents });
  }

  const parent = node.getParent();
  const called = parent !== undefined && Node.isCallExpression(parent) && parent.getExpression() === node;
  const position = node.getSourceFile().getLineAndColumnAtPos(node.getStart());

  return handlerResultLayerAdapter({
    globalUses: [
      globalUseContract.parse({
        name: root.getText(),
        member: node.getName(),
        called,
        args: called && Node.isCallExpression(parent) ? readCallArgsLayerAdapter({ args: parent.getArguments() }) : [],
        line: position.line,
        column: position.column,
      }),
    ],
    descents,
  });
};
