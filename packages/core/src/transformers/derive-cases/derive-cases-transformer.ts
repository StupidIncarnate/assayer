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
 *   A branch is STEERABLE only when EVERY leaf of its condition has an arrangeable operand — a param
 *   of this entry, or an env var when this entry is env-driven. A leaf over anything else — a call
 *   (`if (g())`), a non-param local (`const u = s; if (u > 5)`) — cannot be arranged, so both arms of
 *   its branch derive the SAME inputs and one case necessarily claims an exit its values cannot reach.
 *   Rather than emit those spurious cases, the exits guarded by an un-steerable branch derive NOTHING
 *   and the branch is admitted UNDRIVEN: understood perfectly, but its deciding value is beyond the
 *   runner's reach. Un-steerable takes precedence over the emptiness check — a skipped exit is not the
 *   same claim as an unreachable one, so it is never also reported as unreachable.
 *
 * USAGE:
 * deriveCasesTransformer({ params, branches, exits, envDrivable: false });
 * // Returns { cases: [{ reachesExit, arrange }, …], unreachableExits: [{ line, guardLines }, …],
 * //   undrivenBranches: [{ line, operand? }, …] }
 */
import { derivedTestCaseContract } from '@assayer/shared/contracts';
import type { BranchNode, DerivedTestCase, ExitNode, LineNumber, ParamDescriptor, SymbolName } from '@assayer/shared/contracts';

import { causeArrangeTransformer } from '../cause-arrange/cause-arrange-transformer';
import { conditionLeavesTransformer } from '../condition-leaves/condition-leaves-transformer';
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
}): {
  cases: DerivedTestCase[];
  unreachableExits: { line: LineNumber; guardLines: LineNumber[] }[];
  undrivenBranches: { line: LineNumber; operand?: SymbolName }[];
} => {
  const lineByBranch = new Map(branches.map((branch) => [branch.coverageId, branch.startLine]));
  const paramNames = new Set(params.map((param) => String(param.name)));

  // A branch whose every leaf has an arrangeable operand — a param, or an env var when the entry is
  // env-driven — is STEERABLE and derives cases as normal. Any other branch cannot have its arms told
  // apart, so its guarded exits derive nothing and it is admitted undriven instead.
  const unsteerable = branches.flatMap((branch) => {
    const unarrangeable = conditionLeavesTransformer({ condition: branch.condition }).filter(
      (leaf) =>
        !(
          (leaf.operandParamName !== undefined && paramNames.has(String(leaf.operandParamName))) ||
          (leaf.operandEnvVarName !== undefined && envDrivable)
        ),
    );

    if (unarrangeable.length === 0) {
      return [];
    }

    const operand = unarrangeable.map((leaf) => leaf.operandParamName).find((name) => name !== undefined);

    return [{ branchCoverageId: branch.coverageId, line: branch.startLine, ...(operand === undefined ? {} : { operand }) }];
  });

  const unsteerableIds = new Set(unsteerable.map((entry) => entry.branchCoverageId));

  const perExit = exits
    // An exit behind an un-steerable branch derives no case at all: with the branch's arms
    // indistinguishable, every case it produced would arrange the same inputs and misclaim its exit.
    .filter((exit) => !exit.guardPath.some((step) => unsteerableIds.has(step.branchCoverageId)))
    .map((exit) => {
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
    undrivenBranches: unsteerable.map((entry) => ({
      line: entry.line,
      ...(entry.operand === undefined ? {} : { operand: entry.operand }),
    })),
  };
};
