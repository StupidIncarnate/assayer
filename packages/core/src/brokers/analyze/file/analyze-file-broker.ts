/**
 * PURPOSE: Analyzes one source file into its FileAnalysis — running the ts-morph analysis adapter,
 *   deriving the salient test cases per entry (one per reachable exit), and building the per-line
 *   enrichment (each param's type on the entry line; each branch operand's type + representative
 *   value range on the branch line). Returns an empty analysis when the source fails to parse (the
 *   compile pipeline already reports the syntax error through the map extractor).
 *
 * USAGE:
 * analyzeFileBroker({ source: 'export function f(n: string) { return n; }', relPath: 'src/f.ts' });
 * // Returns a validated FileAnalysis: { functions: [...], enrichment: [...] }
 */
import { fileAnalysisContract } from '@assayer/shared/contracts';
import type { FileAnalysis } from '@assayer/shared/contracts';

import { tsMorphExtractAnalysisAdapter } from '../../../adapters/ts-morph/extract-analysis/ts-morph-extract-analysis-adapter';
import { deriveCasesTransformer } from '../../../transformers/derive-cases/derive-cases-transformer';
import { typeTextTransformer } from '../../../transformers/type-text/type-text-transformer';
import { typeToRangeTransformer } from '../../../transformers/type-to-range/type-to-range-transformer';

export const analyzeFileBroker = ({ source, relPath }: { source: string; relPath: string }): FileAnalysis => {
  const extracted = tsMorphExtractAnalysisAdapter({ source, relPath });

  if (!extracted.success) {
    return fileAnalysisContract.parse({ functions: [], enrichment: [] });
  }

  const functions = extracted.functions.map((fn) => ({
    entry: fn.entry,
    branches: fn.branches,
    exits: fn.exits,
    cases: deriveCasesTransformer({ params: fn.entry.params, branches: fn.branches, exits: fn.exits }),
  }));

  const enrichment = extracted.functions.flatMap((fn) => [
    ...fn.entry.params.map((param) => ({
      line: fn.entry.line,
      symbol: param.name,
      typeText: typeTextTransformer({ type: param.type }),
    })),
    ...fn.branches.map((branch) => {
      const armValues = typeToRangeTransformer({
        type: branch.operandType,
        predicateKind: branch.predicate.kind,
        ...(branch.predicate.literal === undefined ? {} : { literal: branch.predicate.literal }),
      });
      return {
        line: branch.startLine,
        symbol: branch.operandParamName ?? branch.conditionText,
        typeText: typeTextTransformer({ type: branch.operandType }),
        range: [...armValues.satisfying, ...armValues.violating],
      };
    }),
  ]);

  return fileAnalysisContract.parse({ functions, enrichment });
};
