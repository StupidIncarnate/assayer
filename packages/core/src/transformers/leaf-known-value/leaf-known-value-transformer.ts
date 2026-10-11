/**
 * PURPOSE: Answers the value one condition leaf holds when a case runs: `true`, `false`, or `undefined`
 *   when Assayer cannot know. `condition-known-value` asks it for every leaf, then combines the answers
 *   through `not`, `and` and `or`.
 *
 *   A leaf has a known value only where its operand provably holds one when the case runs:
 *   - a command-line read (`operandArgvRead`), run forward by `argv-read-value`;
 *   - a value welded to a same-file constant (`operandConstValue`, or `operandConstLength` for a
 *     `.length` comparison).
 *   Any other operand, such as a call (`isReady()`) or a binding that is not a parameter, has no known
 *   value. Guessing one from its type would make a case claim an arm the code does not take.
 *
 *   The predicate is applied with JavaScript's own operators, so `NaN > 5` is `false` here exactly as it
 *   is at run time. A `.length` comparison on a value with no length is not known, because reading
 *   `.length` off an absent entry throws at run time.
 *
 * USAGE:
 * leafKnownValueTransformer({ leaf });
 * // Returns false for `process.argv[2] === 'yes'`, undefined for `isReady()`
 */
import type { ConditionLeaf, PredicateKind } from '@assayer/shared/contracts';

import { argvReadValueTransformer } from '../argv-read-value/argv-read-value-transformer';

const LENGTH_KINDS = new Set<PredicateKind>(['length-eq', 'length-neq', 'length-gt', 'length-gte', 'length-lt', 'length-lte']);
const LITERAL_FREE_KINDS = new Set<PredicateKind>(['truthy', 'falsy', 'non-nullish', 'undefined-eq', 'undefined-neq']);

export const leafKnownValueTransformer = ({ leaf }: { leaf: ConditionLeaf }): boolean | undefined => {
  const known: readonly unknown[] =
    leaf.operandArgvRead === undefined
      ? leaf.operandConstValue === undefined
        ? leaf.operandConstLength === undefined
          ? []
          : [Array.from({ length: leaf.operandConstLength })]
        : [leaf.operandConstValue]
      : argvReadValueTransformer({ read: leaf.operandArgvRead });

  const { kind, literal } = leaf.predicate;

  if (known.length === 0 || (literal === undefined && !LITERAL_FREE_KINDS.has(kind))) {
    return undefined;
  }

  const [value] = known;
  const length = typeof value === 'string' || Array.isArray(value) ? value.length : undefined;
  const isLength = LENGTH_KINDS.has(kind);

  if (isLength && length === undefined) {
    return undefined;
  }

  const subject = isLength ? length : value;

  switch (kind) {
    case 'truthy':
      return Boolean(value);
    case 'falsy':
      return !value;
    case 'non-nullish':
      return value !== null && value !== undefined;
    case 'undefined-eq':
      return value === undefined;
    case 'undefined-neq':
      return value !== undefined;
    case 'includes':
      return typeof value === 'string' && typeof literal === 'string' ? value.includes(literal) : undefined;
    case 'typeof-eq':
      return typeof value === literal;
    case 'typeof-neq':
      return typeof value !== literal;
    case 'eq':
    case 'length-eq':
      return subject === literal;
    case 'neq':
    case 'length-neq':
      return subject !== literal;
    case 'gt':
    case 'length-gt':
      return (subject as number) > (literal as number);
    case 'gte':
    case 'length-gte':
      return (subject as number) >= (literal as number);
    case 'lt':
    case 'length-lt':
      return (subject as number) < (literal as number);
    case 'lte':
    case 'length-lte':
      return (subject as number) <= (literal as number);
    case 'unrecognized':
    default:
      return undefined;
  }
};
