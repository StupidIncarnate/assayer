/**
 * PURPOSE: Projects the walk's normalized model into the analysis model — the entries whose branches
 *   and exits derived test cases are built from. It is a PURE function of the walk, which is what
 *   lets a file be parsed once and read twice (this and the map projection), and what keeps ts-morph
 *   from leaking past the walk.
 *
 *   Two filters live here rather than in the walk, because they are POLICY about what is worth
 *   testing, not facts about what the code contains:
 *   - Only EXPORTED functions become entries. A nested helper is walked and recorded, but driving it
 *     directly would be testing a private, so it owes no cases of its own.
 *   - The module scope appears only when it actually holds branch logic. Every file has a module
 *     scope; almost none have testable top-level control flow.
 *
 * USAGE:
 * analysisProjectionTransformer({ walked });
 * // Returns a validated AnalysisExtractResult: { success: true, functions: [...] }
 */
import { analysisExtractResultContract } from '../../contracts/analysis-extract-result/analysis-extract-result-contract';
import type { AnalysisExtractResult } from '../../contracts/analysis-extract-result/analysis-extract-result-contract';
import type { WalkFileResult } from '../../contracts/walk-file-result/walk-file-result-contract';

export const analysisProjectionTransformer = ({ walked }: { walked: WalkFileResult }): AnalysisExtractResult => {
  if (!walked.success) {
    return analysisExtractResultContract.parse({ success: false, error: walked.error });
  }

  const entries = walked.scopes.filter(
    (scope) => (scope.kind === 'function' && scope.exported) || (scope.kind === 'module' && scope.branches.length > 0),
  );

  return analysisExtractResultContract.parse({
    success: true,
    functions: entries.map((scope) => ({
      entry: {
        name: scope.name,
        scopePath: scope.scopePath,
        params: scope.params,
        returnType: scope.returnType,
        line: scope.startLine,
        access: scope.access,
      },
      branches: scope.branches,
      exits: scope.exits,
    })),
  });
};
