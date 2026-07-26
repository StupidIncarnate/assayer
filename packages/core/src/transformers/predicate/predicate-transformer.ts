/**
 * PURPOSE: Classifies a condition's raw binary-comparison readout (the ts-morph adapter's serializable
 *   view of `left <op> right`) into a parsed Predicate — the SINGLE place comparison syntax is turned
 *   into the analysis model. A comparison against a literal becomes an eq/neq/gt/gte/lt/lte predicate
 *   carrying that literal; the SAME six operators over a `.length` access become the `length-*` family,
 *   which constrains the operand's length instead of its value; the SAME `===`/`!==` pair over a
 *   `typeof` read becomes the `typeof-*` family, which constrains the operand's RUNTIME TAG instead of
 *   its value; a condition with NO comparison operator is a truthiness test on the operand itself;
 *   everything else is `unrecognized`.
 *
 *   One operator table serves all three axes, and zero is not a special case on any of them.
 *   `s.length === 0` is `length-eq` carrying 0 exactly as `s.length === 3` carries 3 — so a bound the
 *   domain engine can intersect comes out of every length comparison, not just the two the engine used
 *   to recognise. A length compared against a NON-numeric literal is `unrecognized`: a length is a
 *   number, and pretending otherwise would hand the engine a bound it cannot order. A `typeof`
 *   comparison only ever produces `eq`/`neq` against a STRING literal — `typeof` never returns anything
 *   else, and `>`/`<` over a runtime tag names no domain this engine can order — so any other operator or
 *   literal shape over a `typeof` read is `unrecognized` too.
 *
 * USAGE:
 * predicateTransformer({ opKind: 'EqualsEqualsEqualsToken', isLengthAccess: false, isTypeofAccess: false, rightLiteral: 'open' });
 * // Returns { kind: 'eq', literal: 'open' } (validated Predicate)
 */
import { predicateContract } from '@assayer/shared/contracts';
import type { Predicate, RepresentativeValue } from '@assayer/shared/contracts';

export const predicateTransformer = ({
  opKind,
  isLengthAccess,
  isTypeofAccess,
  rightLiteral,
}: {
  opKind: string;
  isLengthAccess: boolean;
  isTypeofAccess: boolean;
  rightLiteral?: RepresentativeValue;
}): Predicate => {
  // No operator at all (`if (flag)`) is a TRUTHINESS test on the operand — not an unclassifiable
  // condition. Reading it as `unrecognized` was a real loss: it is the only predicate a `!` can
  // invert and the only one a bare boolean operand ever has, so `if (a || flag)` and `if (!ready)`
  // derived no values at all. `truthy`/`falsy` already exist in the contract and are already handled
  // by the type→range engine; nothing produced them until now.
  if (opKind === '') {
    return predicateContract.parse({ kind: 'truthy' });
  }

  const comparison =
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

  // The axis is the only thing `.length`/`typeof` changes. A length threshold must be a NUMBER, so a
  // non-numeric right-hand side falls through to unrecognized rather than becoming an unorderable bound.
  // A `typeof` tag must be a STRING, and the only comparisons that name one AT ALL are `eq`/`neq` — a
  // `typeof` read ordered with `>`/`<` names no domain this engine can order, so it stays unrecognized
  // rather than being read as a plain string comparison against the tag's own spelling.
  const kind =
    comparison === 'unrecognized'
      ? comparison
      : isLengthAccess
        ? typeof rightLiteral === 'number'
          ? `length-${comparison}`
          : 'unrecognized'
        : isTypeofAccess
          ? (comparison === 'eq' || comparison === 'neq') && typeof rightLiteral === 'string'
            ? `typeof-${comparison}`
            : 'unrecognized'
          : comparison;

  return predicateContract.parse(
    rightLiteral === undefined || kind === 'unrecognized'
      ? { kind: 'unrecognized' }
      : { kind, literal: rightLiteral },
  );
};
