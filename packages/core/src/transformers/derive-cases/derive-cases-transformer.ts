/**
 * PURPOSE: Derives the salient test cases for an entry — per reachable exit, one case per distinct
 *   CAUSE of that exit (`exit-causes`), realized into arrange values (`cause-arrange`).
 *
 *   "One case per cause" is the whole rule. A single-valued arm (a string length check) yields one
 *   case; an enum's `else` (violating = every other member) fans out one case per member (tier-2);
 *   and a compound condition's `else` fans out one case per REASON it was false — `a > 5 && b < 3`
 *   fails either because `a > 5` failed or because it held and `b < 3` failed. Those are different
 *   flows through the code and cannot share a case: before causes existed, both arms of every
 *   compound condition derived IDENTICAL arrange values, so one of the two cases necessarily claimed
 *   an exit its own values cannot reach.
 *
 *   Each case asserts reaching the exit (structural, P4) — it never records the returned value.
 *
 * USAGE:
 * deriveCasesTransformer({ params, branches, exits });
 * // Returns [{ reachesExit, arrange: [{ param, value }] }, ...] (branded DerivedTestCase[])
 */
import { derivedTestCaseContract } from '@assayer/shared/contracts';
import type { BranchNode, DerivedTestCase, ExitNode, ParamDescriptor } from '@assayer/shared/contracts';

import { causeArrangeTransformer } from '../cause-arrange/cause-arrange-transformer';
import { exitCausesTransformer } from '../exit-causes/exit-causes-transformer';

export const deriveCasesTransformer = ({
  params,
  branches,
  exits,
}: {
  params: ParamDescriptor[];
  branches: BranchNode[];
  exits: ExitNode[];
}): DerivedTestCase[] =>
  exits.flatMap((exit) =>
    exitCausesTransformer({ branches, guardPath: exit.guardPath }).flatMap((cause) =>
      causeArrangeTransformer({ requirements: cause.requirements, params }).map((arrange) =>
        derivedTestCaseContract.parse({ reachesExit: exit.coverageId, arrange }),
      ),
    ),
  );
