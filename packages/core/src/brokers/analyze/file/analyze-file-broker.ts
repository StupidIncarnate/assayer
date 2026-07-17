/**
 * PURPOSE: Turns a walked file into its FileAnalysis — projecting the entries, deriving the salient
 *   test cases per entry (one per reachable exit), building the per-line enrichment (each param's
 *   type on the entry line; each branch operand's type + representative value range on the branch
 *   line), and carrying through both of the walk's admissions: the dark spots it could not follow,
 *   and the branching scopes it read perfectly but nothing can drive.
 *
 *   Both admissions are projected from the WALK, not from the entries above them, because the entries
 *   are where those scopes stop — a private helper is never projected as one, so there is nothing
 *   there to filter and no way to notice it is gone.
 *
 *   It takes the WALK rather than source on purpose: the compile pipeline already walked the file to
 *   build its map, and parsing a second time here is what the single-parse seam exists to avoid.
 *   Returns an empty analysis when the source failed to parse — the pipeline already reports the
 *   syntax error from the same walk.
 *
 * USAGE:
 * analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });
 * // Returns a validated FileAnalysis: { functions: [...], enrichment: [...], darkSpots: [...], undriven: [...] }
 */
import { fileAnalysisContract } from '@assayer/shared/contracts';
import type { FileAnalysis } from '@assayer/shared/contracts';

import type { WalkFileResult } from '../../../contracts/walk-file-result/walk-file-result-contract';
import { analysisProjectionTransformer } from '../../../transformers/analysis-projection/analysis-projection-transformer';
import { conditionLeavesTransformer } from '../../../transformers/condition-leaves/condition-leaves-transformer';
import { darkSpotProjectionTransformer } from '../../../transformers/dark-spot-projection/dark-spot-projection-transformer';
import { deriveCasesTransformer } from '../../../transformers/derive-cases/derive-cases-transformer';
import { typeTextTransformer } from '../../../transformers/type-text/type-text-transformer';
import { typeToRangeTransformer } from '../../../transformers/type-to-range/type-to-range-transformer';
import { undrivenProjectionTransformer } from '../../../transformers/undriven-projection/undriven-projection-transformer';

export const analyzeFileBroker = ({ walked }: { walked: WalkFileResult }): FileAnalysis => {
  const extracted = analysisProjectionTransformer({ walked });

  if (!extracted.success) {
    return fileAnalysisContract.parse({ functions: [], enrichment: [], darkSpots: [], undriven: [] });
  }

  const functions = extracted.functions.map((fn) => ({
    entry: fn.entry,
    branches: fn.branches,
    exits: fn.exits,
    cases: deriveCasesTransformer({
      params: fn.entry.params,
      branches: fn.branches,
      exits: fn.exits,
      // Only a module scope is driven BY importing it, which is when its top-level bindings read the
      // environment. A function is driven by calling it, long after its module ran and froze them.
      envDrivable: fn.entry.access.kind === 'module',
    }),
  }));

  const enrichment = extracted.functions.flatMap((fn) => [
    ...fn.entry.params.map((param) => ({
      line: fn.entry.line,
      symbol: param.name,
      typeText: typeTextTransformer({ type: param.type }),
    })),
    // Enrichment shows a PARAM's type + representative range on the branch line — once per LEAF, so
    // `if (score > 5 && bonus > 1)` enriches both operands. Reading the branch as a single operand
    // showed neither: a compound condition had no param name to report at all.
    // A leaf whose operand is not a simple param has no meaningful symbol/type/range, so it is
    // skipped.
    ...fn.branches.flatMap((branch) =>
      conditionLeavesTransformer({ condition: branch.condition }).flatMap((leaf) => {
        if (leaf.operandParamName === undefined) {
          return [];
        }
        const armValues = typeToRangeTransformer({
          type: leaf.operandType,
          predicateKind: leaf.predicate.kind,
          ...(leaf.predicate.literal === undefined ? {} : { literal: leaf.predicate.literal }),
        });
        return [
          {
            line: branch.startLine,
            symbol: leaf.operandParamName,
            typeText: typeTextTransformer({ type: leaf.operandType }),
            range: [...armValues.satisfying, ...armValues.violating],
          },
        ];
      }),
    ),
  ]);

  return fileAnalysisContract.parse({
    functions,
    enrichment,
    darkSpots: darkSpotProjectionTransformer({ walked }),
    undriven: undrivenProjectionTransformer({ walked }),
  });
};
