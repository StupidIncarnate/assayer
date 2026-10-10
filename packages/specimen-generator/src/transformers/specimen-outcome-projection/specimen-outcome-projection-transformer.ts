/**
 * PURPOSE: Turns what Assayer reported for one specimen file (its analysis and its run) into the
 * same SpecimenOutcome shape the generator predicts. Reach for this to read Assayer's side of the
 * comparison. The prediction side never reads Assayer, so it uses specimenPredictTransformer.
 *
 * Branches come from two lists that are merged by coverage id: the branches of the analysis's
 * functions, and `scopeBranches`, the branches of every scope the walk found. A scope that is not an
 * entry, such as an inline function that nothing can steer, has its branches only in the second list.
 *
 * A trace event is tied to a branch only by exact equality between the event's id and a condition
 * leaf id from the analysis. An id's text is never parsed or prefix-matched.
 *
 * USAGE:
 * specimenOutcomeProjectionTransformer({ analysis, run, scopeBranches });
 * // Returns a SpecimenOutcome: branches, caseFailures, lints, undriven, darkSpots and gaps, each sorted
 */
import type { BranchNode, FileAnalysis, RunResult } from '@assayer/shared/contracts';

import { specimenOutcomeContract } from '../../contracts/specimen-outcome/specimen-outcome-contract';
import type { SpecimenOutcome } from '../../contracts/specimen-outcome/specimen-outcome-contract';

const ARM_ORDER: Record<string, number> = {
  then: 0,
  'else-if': 1,
  else: 2,
};

export const specimenOutcomeProjectionTransformer = ({
  analysis,
  run,
  scopeBranches,
}: {
  analysis: FileAnalysis;
  run: RunResult;
  scopeBranches: readonly BranchNode[];
}): SpecimenOutcome => {
  const outcomesByLeafId = new Map<string, Set<boolean>>();
  for (const runCase of run.cases) {
    if (runCase.status !== 'passed') {
      continue;
    }
    for (const event of runCase.trace) {
      if (event.kind === 'cond' && event.outcome !== undefined) {
        const seen = outcomesByLeafId.get(event.id) ?? new Set<boolean>();
        seen.add(event.outcome);
        outcomesByLeafId.set(event.id, seen);
      }
    }
  }

  const branchesByCoverageId = new Map<string, BranchNode>();
  for (const branch of [...analysis.functions.flatMap((fn) => fn.branches), ...scopeBranches]) {
    if (!branchesByCoverageId.has(branch.coverageId)) {
      branchesByCoverageId.set(branch.coverageId, branch);
    }
  }

  const branches = [...branchesByCoverageId.values()].flatMap((branch) => {
    let sawTrue = false;
    let sawFalse = false;
    const pending = [branch.condition];
    for (let node = pending.pop(); node !== undefined; node = pending.pop()) {
      if (node.kind === 'leaf') {
        const seen = outcomesByLeafId.get(node.id);
        sawTrue ||= seen?.has(true) === true;
        sawFalse ||= seen?.has(false) === true;
      } else if (node.kind === 'not') {
        pending.push(node.operand);
      } else {
        pending.push(node.left, node.right);
      }
    }
    return [
      {
        kind: branch.kind,
        arm: 'then',
        line: branch.startLine,
        driven: sawTrue ? ('driven' as const) : ('never' as const),
      },
      {
        kind: branch.kind,
        arm: 'else',
        line: branch.startLine,
        driven: sawFalse ? ('driven' as const) : ('never' as const),
      },
    ];
  });
  branches.sort(
    (a, b) =>
      a.line - b.line ||
      a.kind.localeCompare(b.kind) ||
      (ARM_ORDER[a.arm] ?? Number.MAX_SAFE_INTEGER) - (ARM_ORDER[b.arm] ?? Number.MAX_SAFE_INTEGER) ||
      a.arm.localeCompare(b.arm),
  );

  const caseFailures = run.cases.flatMap((runCase) =>
    runCase.status === 'passed' ? [] : [{ status: runCase.status, message: runCase.message ?? '' }],
  );

  const lints = run.lints.map((lint) => ({ rule: lint.rule, startLine: lint.startLine }));
  lints.sort((a, b) => a.startLine - b.startLine || (a.rule < b.rule ? -1 : a.rule > b.rule ? 1 : 0));

  const undriven = run.undriven.map((entry) => ({ startLine: entry.startLine }));
  undriven.sort((a, b) => a.startLine - b.startLine);

  const darkSpots = run.darkSpots.map((spot) => ({ startLine: spot.startLine }));
  darkSpots.sort((a, b) => a.startLine - b.startLine);

  const gaps = run.gaps.map((gap) => ({ name: gap.name }));
  gaps.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

  return specimenOutcomeContract.parse({ branches, caseFailures, lints, undriven, darkSpots, gaps });
};
