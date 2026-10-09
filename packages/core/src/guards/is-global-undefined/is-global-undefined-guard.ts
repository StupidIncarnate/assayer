/**
 * PURPOSE: Answers whether one expression is the global `undefined`, so a comparison with it reads as an
 *   `undefined` test rather than a comparison against a name Assayer cannot read. `read-condition` asks
 *   it of a comparison's right side, and `read-env-chain` asks it of both halves of
 *   `x === undefined ? undefined : …`.
 *
 *   `undefined` is an identifier, not a keyword, so a file can declare its own binding with that name.
 *   The guard asks the checker whether anything in THIS file declares the name, and declines when
 *   something does, the same proof `read-env-access` makes for `process`. It reads the identifier's own
 *   text, which is its name and has no formatting freedom.
 *
 * USAGE:
 * isGlobalUndefinedGuard({ node: binary.getRight() });
 * // Returns true for the `undefined` in `x === undefined`, false under a local `const undefined = 1`
 */
import { Node } from '#gateway/npm/ts-morph';

export const isGlobalUndefinedGuard = ({ node }: { node?: Node }): boolean =>
  node !== undefined &&
  Node.isIdentifier(node) &&
  node.getText() === 'undefined' &&
  !(node.getSymbol()?.getDeclarations() ?? []).some((declared) => declared.getSourceFile() === node.getSourceFile());
