/**
 * PURPOSE: Contract for a parsed branch predicate — the classified comparison a condition makes
 *   on its operand (equality, length check, numeric comparison, truthiness) plus the optional
 *   literal it compares against — feeding the type→range engine that derives value sets.
 *
 *   A `length-*` kind constrains the LENGTH of its operand, a plain kind constrains the operand's own
 *   VALUE. They are two axes rather than two spellings of one thing: `gt 3` and `length-gt 3` narrow
 *   different sets, and a domain has to carry both at once for `s.length >= 2 && s.length <= 5` to
 *   intersect. Every comparison operator exists on both axes, so the zero case is nothing special —
 *   `s.length === 0` is `length-eq` carrying 0, exactly as `s.length === 3` carries 3.
 *
 *   `non-nullish` is the nullish-coalescing operand's test: `a ?? b` returns `a` when it is neither
 *   null nor undefined, and falls through to `b` otherwise. It carries no literal — it partitions the
 *   operand's declared type into its non-null values (satisfying) and null (violating).
 *
 *   `typeof-eq`/`typeof-neq` are a `typeof` comparison (`typeof target === 'string'`): a THIRD axis,
 *   next to the plain value axis and the length axis, that partitions the operand's type by which
 *   members produce the literal's RUNTIME TAG (`'string'`, `'number'`, `'boolean'`, `'object'`,
 *   `'function'`, and so on) versus which do not. The literal is always a string (the only thing
 *   `typeof` ever produces), so a `typeof` comparison against a non-string literal, or using any
 *   operator other than `===`/`!==`, is `unrecognized` rather than one of these two kinds.
 *
 * USAGE:
 * predicateContract.parse({ kind: 'length-eq', literal: 0 });
 * predicateContract.parse({ kind: 'eq', literal: 'blocked' });
 * // Returns a validated Predicate (branded fields)
 */
import { z } from '#gateway/npm/zod';

import { representativeValueContract } from '../representative-value/representative-value-contract';

export const predicateContract = z.object({
  kind: z
    .enum([
      'eq',
      'neq',
      'length-eq',
      'length-neq',
      'length-gt',
      'length-gte',
      'length-lt',
      'length-lte',
      'gt',
      'gte',
      'lt',
      'lte',
      'truthy',
      'falsy',
      'non-nullish',
      'typeof-eq',
      'typeof-neq',
      'unrecognized',
    ])
    .brand<'PredicateKind'>(),
  literal: representativeValueContract.optional(),
});

export type Predicate = z.infer<typeof predicateContract>;
export type PredicateKind = Predicate['kind'];
