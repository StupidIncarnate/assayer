/**
 * PURPOSE: Derives the salient test cases for an entry — per reachable exit, one case per distinct
 *   CAUSE of that exit (`exit-causes`), realized into arrange values (`cause-arrange`) — and reports
 *   the exits that no value can reach at all.
 *
 *   "One case per cause" is the whole rule. A single-valued arm (a string length check) yields one
 *   case; an enum's `else` (violating = every other member) fans out one case per member (tier-2);
 *   and a compound condition's `else` fans out one case per REASON it was false — `a > 5 && b < 3`
 *   fails either because `a > 5` failed or because it held and `b < 3` failed. Those are different
 *   flows through the code and cannot share a case: before causes existed, both arms of every
 *   compound condition derived IDENTICAL arrange values, so one of the two cases necessarily claimed
 *   an exit its own values cannot reach.
 *
 *   An exit whose every cause is unsatisfiable is UNREACHABLE, and it is reported rather than given a
 *   case. Deriving one anyway is not a smaller failure: the values would have to come from somewhere
 *   other than the guards, so the case reaches a different exit and reports correct code as failing —
 *   which reads as an Assayer bug rather than as the dead branch it is. Reporting nothing at all would
 *   be worse still: an exit that silently owes no case is indistinguishable from a covered one.
 *
 *   Each case asserts reaching the exit (structural, P4) — it never records the returned value.
 *
 *   `envDrivable` says whether THIS entry is one the environment is an input to — a module scope,
 *   which runs when it is imported and reads the environment as it goes. It is passed down rather
 *   than inferred here because it is a fact about the entry, and the leaves only know a fact about
 *   the code.
 *
 * USAGE:
 * deriveCasesTransformer({ params, branches, exits, envDrivable: false });
 * // Returns { cases: [{ reachesExit, arrange }, …], unreachableExits: [{ line, guardLines }, …] }
 */
import { derivedTestCaseContract } from '@assayer/shared/contracts';
import type { BranchNode, DerivedTestCase, ExitNode, LineNumber, ParamDescriptor } from '@assayer/shared/contracts';

import { causeArrangeTransformer } from '../cause-arrange/cause-arrange-transformer';
import { exitCausesTransformer } from '../exit-causes/exit-causes-transformer';

export const deriveCasesTransformer = ({
  params,
  branches,
  exits,
  envDrivable,
}: {
  params: ParamDescriptor[];
  branches: BranchNode[];
  exits: ExitNode[];
  envDrivable: boolean;
}): { cases: DerivedTestCase[]; unreachableExits: { line: LineNumber; guardLines: LineNumber[] }[] } => {
  const lineByBranch = new Map(branches.map((branch) => [branch.coverageId, branch.startLine]));

  const perExit = exits.map((exit) => {
    const arranged = exitCausesTransformer({ branches, guardPath: exit.guardPath }).map((cause) =>
      causeArrangeTransformer({ requirements: cause.requirements, params, envDrivable }),
    );

    return {
      exit,
      cases: arranged.flatMap((result) =>
        result.arrangements.map((arrange) => derivedTestCaseContract.parse({ reachesExit: exit.coverageId, arrange })),
      ),
      // Every route to it is impossible — not merely one of several. An exit reachable by any cause is
      // reachable, and only some of its arrangements went missing.
      unreachable: arranged.length > 0 && arranged.every((result) => result.unreachable),
    };
  });

  return {
    cases: perExit.flatMap((entry) => entry.cases),
    unreachableExits: perExit.flatMap((entry) =>
      entry.unreachable
        ? [
            {
              line: entry.exit.line,
              guardLines: entry.exit.guardPath.flatMap((step) => {
                const line = lineByBranch.get(step.branchCoverageId);
                return line === undefined ? [] : [line];
              }),
            },
          ]
        : [],
    ),
  };
};
