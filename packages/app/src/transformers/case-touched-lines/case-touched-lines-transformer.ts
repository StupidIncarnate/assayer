/**
 * PURPOSE: Computes the source lines a single derived test case runs through — the line of every exit
 *   on its `reachesPath` plus the line of each branch on those exits' guard paths, unioned and deduped.
 *   The case's `arms` add the line of every branch the route takes, so a branch whose arm falls
 *   through (an `if` with no `else`) still counts as touched. Drives the code-viewer gutter counts and the detail-panel hover highlighting so the two views agree
 *   on which lines belong to a case.
 *
 * USAGE:
 * caseTouchedLinesTransformer({ functionAnalysis: fn, reachesPath: ['formatGreeting/return@if-then'], arms: testCase.arms });
 * // Returns [3, 2] — the exit line and its guard branch line (branded LineNumber[])
 */
import type { FunctionAnalysis, Coverage, GuardStep } from '@assayer/shared/contracts';

export const caseTouchedLinesTransformer = ({
  functionAnalysis,
  reachesPath,
  arms = [],
}: {
  functionAnalysis: FunctionAnalysis;
  reachesPath: Coverage['id'][];
  arms?: readonly GuardStep[];
}): number[] => {
  const lines = reachesPath.flatMap((coverageId) => {
    const exit = functionAnalysis.exits.find((candidate) => candidate.coverageId === coverageId);

    if (exit === undefined) {
      return [];
    }

    const branchLines = exit.guardPath.flatMap((step) => {
      const branch = functionAnalysis.branches.find((candidate) => candidate.coverageId === step.branchCoverageId);
      return branch === undefined ? [] : [branch.startLine];
    });

    return [exit.line, ...branchLines];
  });

  const armLines = arms.flatMap((step) => {
    const branch = functionAnalysis.branches.find((candidate) => candidate.coverageId === step.branchCoverageId);
    return branch === undefined ? [] : [branch.startLine];
  });

  return [...new Set([...lines, ...armLines])];
};
