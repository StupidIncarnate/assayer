/**
 * PURPOSE: Aggregates a file's derived test cases into per-line gutter markers — for every source
 *   line touched by at least one case, the count of cases whose coverage runs through it. Drives the
 *   code-viewer's per-line test-count gutter. Reuses caseTouchedLinesTransformer per case so the
 *   gutter counts agree with the detail-panel hover highlighting.
 *
 * USAGE:
 * caseGutterMarkersTransformer({ functions: analysis.functions });
 * // Returns [{ line: 2, count: 2 }, { line: 3, count: 1 }, { line: 6, count: 1 }] (branded GutterMarker[])
 */
import type { FunctionAnalysis } from '@assayer/shared/contracts';

import { gutterMarkerContract } from '../../contracts/gutter-marker/gutter-marker-contract';
import type { GutterMarker } from '../../contracts/gutter-marker/gutter-marker-contract';
import { caseTouchedLinesTransformer } from '../case-touched-lines/case-touched-lines-transformer';

export const caseGutterMarkersTransformer = ({
  functions,
}: {
  functions: readonly FunctionAnalysis[];
}): readonly GutterMarker[] => {
  const touchedLines = functions.flatMap((fn) =>
    fn.cases.flatMap((testCase) =>
      caseTouchedLinesTransformer({ functionAnalysis: fn, reachesExit: testCase.reachesExit }),
    ),
  );

  return [...new Set(touchedLines)].map((line) =>
    gutterMarkerContract.parse({
      line,
      count: touchedLines.filter((candidate) => candidate === line).length,
    }),
  );
};
