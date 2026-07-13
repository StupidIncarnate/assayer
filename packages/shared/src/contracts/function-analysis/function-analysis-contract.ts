/**
 * PURPOSE: Contract for a function analysis — the full analyzed model of one exported entry: its
 *   signature, its branch nodes, its exit nodes, and the salient derived test cases (one per
 *   reachable exit). Persisted in the cache blob and rendered in the detail-view tabs.
 *
 * USAGE:
 * functionAnalysisContract.parse({ entry, branches, exits, cases });
 * // Returns a validated FunctionAnalysis (branded fields)
 */
import { z } from 'zod';

import { entrySignatureContract } from '../entry-signature/entry-signature-contract';
import { branchNodeContract } from '../branch-node/branch-node-contract';
import { exitNodeContract } from '../exit-node/exit-node-contract';
import { derivedTestCaseContract } from '../derived-test-case/derived-test-case-contract';

export const functionAnalysisContract = z.object({
  entry: entrySignatureContract,
  branches: z.array(branchNodeContract),
  exits: z.array(exitNodeContract),
  cases: z.array(derivedTestCaseContract),
});

export type FunctionAnalysis = z.infer<typeof functionAnalysisContract>;
