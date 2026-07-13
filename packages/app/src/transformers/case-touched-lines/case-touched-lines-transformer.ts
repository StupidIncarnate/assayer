/**
 * PURPOSE: Computes the source lines a single derived test case runs through — the line of the exit
 *   it reaches plus the line of each branch on its guard path. Drives the code-viewer gutter counts
 *   and the detail-panel hover highlighting so the two views agree on which lines belong to a case.
 *
 * USAGE:
 * caseTouchedLinesTransformer({ functionAnalysis: fn, reachesExit: 'formatGreeting/return@if-then' });
 * // Returns [3, 2] — the exit line and its guard branch line (branded LineNumber[])
 */
import type { FunctionAnalysis, CoverageId, LineNumber } from '@assayer/shared/contracts';

export const caseTouchedLinesTransformer = ({
  functionAnalysis,
  reachesExit,
}: {
  functionAnalysis: FunctionAnalysis;
  reachesExit: CoverageId;
}): LineNumber[] => {
  const exit = functionAnalysis.exits.find((candidate) => candidate.coverageId === reachesExit);

  if (exit === undefined) {
    return [];
  }

  const branchLines = exit.guardPath.flatMap((step) => {
    const branch = functionAnalysis.branches.find((candidate) => candidate.coverageId === step.branchCoverageId);
    return branch === undefined ? [] : [branch.startLine];
  });

  return [exit.line, ...branchLines];
};
