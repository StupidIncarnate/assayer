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

import { entrySignatureContract, branchNodeContract, exitNodeContract } from '@assayer/shared/contracts';

export const extractedFunctionContract = z.object({
  entry: entrySignatureContract,
  branches: z.array(branchNodeContract),
  exits: z.array(exitNodeContract),
});

export type ExtractedFunction = z.infer<typeof extractedFunctionContract>;
