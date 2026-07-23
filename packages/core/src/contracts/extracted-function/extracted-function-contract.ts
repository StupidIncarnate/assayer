/**
 * PURPOSE: Contract for an extracted function — the ts-morph adapter's per-entry output before
 *   case derivation: the entry signature, its branch nodes, and its exit nodes. The analyze broker
 *   turns each extracted function into a full FunctionAnalysis by deriving its cases.
 *
 * USAGE:
 * extractedFunctionContract.parse({ entry, branches, exits });
 * // Returns a validated ExtractedFunction (branded fields)
 */
import { z } from 'zod';

import { entrySignatureContract, branchNodeContract, conditionNodeContract, exitNodeContract } from '@assayer/shared/contracts';

export const extractedFunctionContract = z.object({
  entry: entrySignatureContract,
  branches: z.array(branchNodeContract),
  exits: z.array(exitNodeContract),
  // The decomposed condition this entry's body RETURNS, present only when the entry is a boolean
  // predicate whose whole body is `return <comparison>` (`function tooBig(n){ return n > 50 }`). It
  // carries the walk's `predicateSignature` onto the entry so `derive-cases` can split the two return
  // values apart: a branchless predicate distinguishes `true` from `false` on the SAME exit, and only
  // this axis makes both outputs a case rather than one representative fill. Absent for any body that
  // is not a single comparison return.
  predicateSignature: conditionNodeContract.optional(),
});

export type ExtractedFunction = z.infer<typeof extractedFunctionContract>;
