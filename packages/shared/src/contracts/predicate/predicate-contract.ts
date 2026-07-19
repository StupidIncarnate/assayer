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
 * USAGE:
 * predicateContract.parse({ kind: 'length-eq', literal: 0 });
 * predicateContract.parse({ kind: 'eq', literal: 'blocked' });
 * // Returns a validated Predicate (branded fields)
 */
import { z } from 'zod';

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
      'unrecognized',
    ])
    .brand<'PredicateKind'>(),
  literal: representativeValueContract.optional(),
});

export type Predicate = z.infer<typeof predicateContract>;
export type PredicateKind = Predicate['kind'];
