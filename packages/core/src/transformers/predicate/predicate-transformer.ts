/**
 * PURPOSE: Classifies a condition's raw binary-comparison readout (the ts-morph adapter's serializable
 *   view of `left <op> right`) into a parsed Predicate — the SINGLE place comparison syntax is turned
 *   into the analysis model. A `.length` comparison against zero becomes a length predicate; any other
 *   comparison against a literal becomes an eq/neq/gt/gte/lt/lte predicate carrying that literal;
 *   everything else is `unrecognized`.
 *
 * USAGE:
 * predicateTransformer({ opKind: 'EqualsEqualsEqualsToken', isLengthAccess: false, rightLiteral: 'open', rightIsZero: false });
 * // Returns { kind: 'eq', literal: 'open' } (validated Predicate)
 */
import { predicateContract } from '@assayer/shared/contracts';
import type { Predicate, RepresentativeValue } from '@assayer/shared/contracts';

export const predicateTransformer = ({
  opKind,
  isLengthAccess,
  rightLiteral,
  rightIsZero,
}: {
  opKind: string;
  isLengthAccess: boolean;
  rightLiteral?: RepresentativeValue;
  rightIsZero: boolean;
}): Predicate => {
  if (isLengthAccess) {
    return predicateContract.parse(
      opKind === 'EqualsEqualsEqualsToken' && rightIsZero
        ? { kind: 'length-eq-zero' }
        : (opKind === 'GreaterThanToken' || opKind === 'ExclamationEqualsEqualsToken') && rightIsZero
          ? { kind: 'length-gt-zero' }
          : { kind: 'unrecognized' },
    );
  }

  const kind =
    opKind === 'EqualsEqualsEqualsToken'
      ? 'eq'
      : opKind === 'ExclamationEqualsEqualsToken'
        ? 'neq'
        : opKind === 'GreaterThanToken'
          ? 'gt'
          : opKind === 'GreaterThanEqualsToken'
            ? 'gte'
            : opKind === 'LessThanToken'
              ? 'lt'
              : opKind === 'LessThanEqualsToken'
                ? 'lte'
                : 'unrecognized';

  return predicateContract.parse(
    rightLiteral === undefined || kind === 'unrecognized'
      ? { kind: 'unrecognized' }
      : { kind, literal: rightLiteral },
  );
};
