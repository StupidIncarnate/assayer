/**
 * PURPOSE: Handles a property access `root.member`. Two flat file-level facts come off it, never
 *   scope-claimed (like a module edge):
 *
 *   - A GLOBAL USE when `root` is an ambient-external identifier the hermetic walk cannot type
 *     (`console`→`log`, `process`→`env`) — the raw, unresolved half a later stitch resolves against
 *     `@types/node`'s global scope. Only the leftmost access off the root emits it: `process.env.MODE`
 *     records `process`→`env` from the inner `process.env` access, whose root is the bare identifier.
 *   - An ENV READ when this IS the outer `process.env.<X>` access — its object is the ambient
 *     `process.env`, so `<X>` (`node.getName()`) is the environment property the file reads. When the
 *     access is the operand of an equality comparison (`process.env.MODE === 'production'`), the
 *     compared LITERAL rides along, the value the stub stitch guesses the property is. A read that is
 *     not a direct comparison operand (`Number(process.env.CODE)`, a bare `const m = process.env.MODE`)
 *     carries no literal — it still names the property, so the file is recorded as a reader.
 *
 *   `called` is whether a global access is the callee of a call (`console.log(x)` vs a bare
 *   `process.env`), read off the IMMEDIATE parent, and `args` is the call's structural argument shapes
 *   (never a source value, P4). It opens no scope; a member access binds no name and branches nothing.
 *   It descends its children so nested scopes/branches/calls in the object or arguments are still found.
 *
 * USAGE:
 * handleMemberAccessLayerAdapter({ node: propertyAccess, context });
 * // Returns a HandlerResult with one global use or one env read (or neither) and the child descents
 */
import { Node } from 'ts-morph';
import type { PropertyAccessExpression } from 'ts-morph';

import { envReadContract, globalUseContract, representativeValueContract } from '@assayer/shared/contracts';

import type { WalkContext } from '../../../contracts/walk-context/walk-context-contract';
import { envSourceStatics } from '../../../statics/env-source/env-source-statics';
import { handlerResultLayerAdapter } from './handler-result-layer-adapter';
import { readAmbientRootLayerAdapter } from './read-ambient-root-layer-adapter';
import { readCallArgsLayerAdapter } from './read-call-args-layer-adapter';

// The equality operators whose sibling literal NAMES the value an env property is compared against. A
// relational operator (`>`/`<`) states a threshold, not a value the property equals, so it is left out
// — the stub guesses from equality literals, exactly as the design describes.
const EQUALITY_OPERATOR_KINDS = new Set([
  'EqualsEqualsEqualsToken',
  'EqualsEqualsToken',
  'ExclamationEqualsEqualsToken',
  'ExclamationEqualsToken',
]);

export const handleMemberAccessLayerAdapter = ({
  node,
  context,
}: {
  node: PropertyAccessExpression;
  context: WalkContext;
}): ReturnType<typeof handlerResultLayerAdapter> => {
  const root = node.getExpression();
  const descents = node.forEachChildAsArray().map((child) => ({ node: child, context }));

  // The outer `process.env.<X>` access: its object is a `process.env` access whose own root is the
  // ambient `process`. `<X>` is the environment property; an equality-comparison sibling names its
  // guessed value.
  const container = Node.isPropertyAccessExpression(root) ? root : undefined;
  const isEnvContainer =
    container !== undefined &&
    container.getName() === envSourceStatics.property &&
    readAmbientRootLayerAdapter({ node: container.getExpression() });

  if (isEnvContainer) {
    const parent = node.getParent();
    const binary = parent !== undefined && Node.isBinaryExpression(parent) ? parent : undefined;
    const sibling =
      binary === undefined || !EQUALITY_OPERATOR_KINDS.has(binary.getOperatorToken().getKindName())
        ? undefined
        : binary.getLeft() === node
          ? binary.getRight()
          : binary.getRight() === node
            ? binary.getLeft()
            : undefined;
    const literal =
      sibling === undefined
        ? undefined
        : Node.isStringLiteral(sibling) || Node.isNumericLiteral(sibling)
          ? representativeValueContract.parse(sibling.getLiteralValue())
          : sibling.getKindName() === 'TrueKeyword'
            ? representativeValueContract.parse(true)
            : sibling.getKindName() === 'FalseKeyword'
              ? representativeValueContract.parse(false)
              : undefined;

    return handlerResultLayerAdapter({
      envReads: [
        envReadContract.parse({
          property: node.getName(),
          literals: literal === undefined ? [] : [literal],
        }),
      ],
      descents,
    });
  }

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
