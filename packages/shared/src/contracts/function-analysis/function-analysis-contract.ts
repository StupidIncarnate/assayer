/**
 * PURPOSE: Contract for a function analysis — the full analyzed model of one exported entry: its
 *   signature, its branch nodes, its exit nodes, and the salient derived test cases (one per
 *   reachable exit). Persisted in the cache blob and rendered in the detail-view tabs.
 *
 *   `predicateSignature` is the entry's own return comparison, present when its whole body returns one
 *   condition every leaf of which is a real comparison (`(n) => n > 50`). It is an axis of the case set
 *   in its own right — what splits the `true` return from the `false` one — and the ONLY axis a
 *   branchless predicate has. It rides the analysis because the case set has to be re-derivable FROM
 *   the analysis: every consume-time overlay re-derives an entry it drives, and one that cannot see
 *   this axis silently hands back fewer cases than the same entry derived without it.
 *
 * USAGE:
 * functionAnalysisContract.parse({ entry, branches, exits, cases });
 * // Returns a validated FunctionAnalysis (branded fields)
 */
import { z } from 'zod';

import { entrySignatureContract } from '../entry-signature/entry-signature-contract';
import { branchNodeContract } from '../branch-node/branch-node-contract';
import { conditionNodeContract } from '../condition-node/condition-node-contract';
import { exitNodeContract } from '../exit-node/exit-node-contract';
import { derivedTestCaseContract } from '../derived-test-case/derived-test-case-contract';

export const functionAnalysisContract = z.object({
  entry: entrySignatureContract,
  branches: z.array(branchNodeContract),
  exits: z.array(exitNodeContract),
  cases: z.array(derivedTestCaseContract),
  predicateSignature: conditionNodeContract.optional(),
});

export type FunctionAnalysis = z.infer<typeof functionAnalysisContract>;
