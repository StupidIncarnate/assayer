/**
 * PURPOSE: Computes the source lines a single derived test case runs through — the line of every exit
 *   on its `reachesPath` plus the line of each branch on those exits' guard paths, unioned and deduped.
 *   Drives the code-viewer gutter counts and the detail-panel hover highlighting so the two views agree
 *   on which lines belong to a case.
 *
 * USAGE:
 * caseTouchedLinesTransformer({ functionAnalysis: fn, reachesPath: ['formatGreeting/return@if-then'] });
 * // Returns [3, 2] — the exit line and its guard branch line (branded LineNumber[])
 */
import type { FunctionAnalysis, CoverageId, LineNumber } from '@assayer/shared/contracts';

export const caseTouchedLinesTransformer = ({
  functionAnalysis,
  reachesPath,
}: {
  functionAnalysis: FunctionAnalysis;
  reachesPath: CoverageId[];
}): LineNumber[] => {
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

  return [...new Set(lines)];
};
