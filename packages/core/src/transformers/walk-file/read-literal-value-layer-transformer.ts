/**
 * PURPOSE: Reads the VALUE a literal expression denotes, for a reader that compares against it or
 *   evaluates it: a string, a number, `true`, `false` or `null`. Reach for this whenever a condition
 *   reader needs a literal's value; `read-const-operand` is the sibling that reads a literal through a
 *   same-file `const` binding instead of in place.
 *
 *   It reads node KINDS and `getLiteralValue()`, never a literal's spelling, so `'x'` and `"x"` give
 *   one value and `0x10` reads as 16. Parentheses are formatting and are seen through. `null` is a
 *   keyword node and reads as the value `null`. `undefined` is an identifier, not a literal, and reads
 *   as nothing: `RepresentativeValue` has no `undefined` member to carry it.
 *
 * USAGE:
 * readLiteralValueLayerTransformer({ node: binary.getRight() });
 * // Returns 7 for `7`, 'yes' for `'yes'`, false for `false`, null for `null`, undefined for `x`
 */
import { Node } from '#gateway/npm/ts-morph';

import { representativeValueContract } from '@assayer/shared/contracts';
import type { RepresentativeValue } from '@assayer/shared/contracts';

export const readLiteralValueLayerTransformer = ({ node }: { node: Node }): RepresentativeValue | undefined => {
  if (Node.isParenthesizedExpression(node)) {
    return readLiteralValueLayerTransformer({ node: node.getExpression() });
  }

  if (Node.isStringLiteral(node) || Node.isNumericLiteral(node)) {
    return representativeValueContract.parse(node.getLiteralValue());
  }

  if (Node.isTrueLiteral(node)) {
    return representativeValueContract.parse(true);
  }

  if (Node.isFalseLiteral(node)) {
    return representativeValueContract.parse(false);
  }

  if (Node.isNullLiteral(node)) {
    return representativeValueContract.parse(null);
  }

  return undefined;
};
