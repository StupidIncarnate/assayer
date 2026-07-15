/**
 * PURPOSE: Contract for a condition LEAF — the atom of a branch's condition tree: one operand, its
 *   type, and the predicate tested against it, plus the cache-internal id that addresses this leaf
 *   individually for coverage.
 *
 *   It is its own contract rather than an inline member of `condition-node` because it is consumed
 *   ALONE: cause enumeration reasons about "this leaf must be true/false" and needs the leaf's exact
 *   type, not the whole recursive union narrowed at every access.
 *
 * USAGE:
 * conditionLeafContract.parse({
 *   kind: 'leaf', id: 'grade/if:…#leaf.0',
 *   operandParamName: 'score', operandType: { kind: 'number' }, predicate: { kind: 'gt', literal: 5 },
 * });
 * // Returns a validated ConditionLeaf (branded fields)
 */
import { z } from 'zod';

import { coverageIdContract } from '../coverage-id/coverage-id-contract';
import { predicateContract } from '../predicate/predicate-contract';
import { symbolNameContract } from '../symbol-name/symbol-name-contract';
import { typeDescriptorContract } from '../type-descriptor/type-descriptor-contract';

export const conditionLeafContract = z.object({
  kind: z.literal('leaf'),
  id: coverageIdContract,
  operandParamName: symbolNameContract.optional(),
  operandType: typeDescriptorContract,
  predicate: predicateContract,
});

export type ConditionLeaf = z.infer<typeof conditionLeafContract>;
