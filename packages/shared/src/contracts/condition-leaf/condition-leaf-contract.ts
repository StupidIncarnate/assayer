/**
 * PURPOSE: Contract for a condition LEAF — the atom of a branch's condition tree: one operand, its
 *   type, and the predicate tested against it, plus the cache-internal id that addresses this leaf
 *   individually for coverage.
 *
 *   It is its own contract rather than an inline member of `condition-node` because it is consumed
 *   ALONE: cause enumeration reasons about "this leaf must be true/false" and needs the leaf's exact
 *   type, not the whole recursive union narrowed at every access.
 *
 *   `operandEnvVarName` names WHERE the operand's value entered the program, which is a different
 *   question from what its type is and is answered by a different reader. It appears when the
 *   operand's binding is initialized from the process environment, and it is what makes a scope
 *   nothing can call drivable anyway: the environment is an input like any other, so a case that
 *   sets it before the module loads picks the arm. It is stated here as a FACT about the code
 *   wherever it is true — whether an entry can actually be driven through it is policy, and policy
 *   lives in the projections.
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
import { envVarNameContract } from '../env-var-name/env-var-name-contract';
import { predicateContract } from '../predicate/predicate-contract';
import { symbolNameContract } from '../symbol-name/symbol-name-contract';
import { typeDescriptorContract } from '../type-descriptor/type-descriptor-contract';

export const conditionLeafContract = z.object({
  kind: z.literal('leaf'),
  id: coverageIdContract,
  operandParamName: symbolNameContract.optional(),
  operandEnvVarName: envVarNameContract.optional(),
  operandType: typeDescriptorContract,
  predicate: predicateContract,
});

export type ConditionLeaf = z.infer<typeof conditionLeafContract>;
