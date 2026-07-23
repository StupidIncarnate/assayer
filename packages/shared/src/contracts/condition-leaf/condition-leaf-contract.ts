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
 *   `operandCallPosition` anchors WHERE a call operand is written, keyed to the same source coordinate
 *   the call site records. It appears when the operand is a CALL (`if (tooBig(x))`), whose predicate
 *   reads as bare `truthy` because a single-file parse cannot type the callee. The position is the
 *   foreign key that lets a compose pass join this leaf back to the call site it came from, and from
 *   there to the callee's own predicate — swapping the opaque leaf for the callee's comparison rebased
 *   onto the caller's argument. It is DISPLAY-inert identity plumbing: a coordinate the parse already
 *   holds, never re-derived.
 *
 *   `operandPropertyPath` and `operandTypeRef` record an OBJECT-MEMBER operand (`if (config.mode ===
 *   'a')`): `operandParamName` is the root the read starts from (`config`), `operandPropertyPath` the
 *   `.member` chain off it (`['mode']`, or `['user','role']` for `user.role`), and `operandTypeRef` the
 *   syntactic type-reference NAME the root param declares (`Config`). Together they are the foreign key
 *   the stub stitch joins on to attach the branched literal to the property's value demand on that
 *   type's definition. A leaf carrying `operandPropertyPath` is not SCALAR-arrangeable, so its branch is
 *   admitted UNDRIVEN in the per-file blob and DRIVEN at consume time by `stub-realize`, which arranges
 *   the object param from the merged stub view.
 *
 * USAGE:
 * conditionLeafContract.parse({
 *   kind: 'leaf', id: 'grade/if:…#leaf.0',
 *   operandParamName: 'score', operandType: { kind: 'number' }, predicate: { kind: 'gt', literal: 5 },
 * });
 * // Returns a validated ConditionLeaf (branded fields)
 */
import { z } from 'zod';

import { columnNumberContract } from '../column-number/column-number-contract';
import { coverageIdContract } from '../coverage-id/coverage-id-contract';
import { envVarNameContract } from '../env-var-name/env-var-name-contract';
import { lineNumberContract } from '../line-number/line-number-contract';
import { predicateContract } from '../predicate/predicate-contract';
import { symbolNameContract } from '../symbol-name/symbol-name-contract';
import { typeDescriptorContract } from '../type-descriptor/type-descriptor-contract';

export const conditionLeafContract = z.object({
  kind: z.literal('leaf'),
  id: coverageIdContract,
  operandParamName: symbolNameContract.optional(),
  operandPropertyPath: z.array(symbolNameContract).min(1).optional(),
  operandTypeRef: symbolNameContract.optional(),
  operandEnvVarName: envVarNameContract.optional(),
  operandCallPosition: z.object({ line: lineNumberContract, column: columnNumberContract }).optional(),
  operandType: typeDescriptorContract,
  predicate: predicateContract,
});

export type ConditionLeaf = z.infer<typeof conditionLeafContract>;
