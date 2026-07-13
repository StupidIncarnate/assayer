/**
 * PURPOSE: Contract for a parsed branch predicate — the classified comparison a condition makes
 *   on its operand (equality, length check, numeric comparison, truthiness) plus the optional
 *   literal it compares against — feeding the type→range engine that derives value sets.
 *
 * USAGE:
 * predicateContract.parse({ kind: 'length-eq-zero' });
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
      'length-eq-zero',
      'length-gt-zero',
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
