/**
 * PURPOSE: Counts the admissions one file's analysis lists in the detail panel: its undriven entries,
 *   lints, dark spots and gaps. The file tree shows this count as the file's error badge.
 *
 * USAGE:
 * analysisErrorCountTransformer({ analysis });
 * // Returns 3 for an analysis with one undriven entry and two lints
 */
import type { FileAnalysis } from '@assayer/shared/contracts';

export const analysisErrorCountTransformer = ({
  analysis,
}: {
  analysis: Pick<FileAnalysis, 'undriven' | 'lints' | 'darkSpots' | 'gaps'>;
}): number => analysis.undriven.length + analysis.lints.length + analysis.darkSpots.length + analysis.gaps.length;
