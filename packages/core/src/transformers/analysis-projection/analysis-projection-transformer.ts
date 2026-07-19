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
 *   - The module scope appears when it holds branch logic OR when it CONSUMES an external — a call
 *     into an import (package/builtin resolve later, but the callee arm is `import`), an ambient
 *     global USE that is a call (`console.log(...)`, `process.cwd()`), or a VALUE flow that binds an
 *     external as a value (`const separator = sep`, `const e = process.env`). Consuming something the
 *     file did not author is a consumption site that owes a case, exactly like a top-level branch owes
 *     one; a module that only touches its OWN local bindings is not — that local scope is already the
 *     entry. Every file has a module scope; almost none have testable top-level logic.
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

  // A module CONSUMES an external when it calls an import, binds an external as a VALUE, or when the
  // file makes an ambient global call. The import call rides the scope's own `calls`; the value flow
  // rides its own `valueUses`; the global call rides the file-level `globalUses` channel, which is the
  // module scope's — top-level code is what runs at import time. A module that only touches its OWN
  // local bindings is not consuming: that local scope is the entry.
  const entries = walked.scopes.filter(
    (scope) =>
      (scope.kind === 'function' && scope.exported) ||
      (scope.kind === 'module' &&
        (scope.branches.length > 0 ||
          scope.calls.some((call) => call.callee.target === 'import') ||
          // Every value use is an import/global/local reference the walk resolved — an external data
          // flow — so any of them is a consumption site.
          scope.valueUses.length > 0 ||
          walked.globalUses.some((use) => use.called))),
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
        // A module entry with EXACTLY ONE exported top-level binding is labelled by that name; several
        // exports (or none) leave it unset, and the surface falls back to the file basename. Content
        // only — never a path, never identity. Non-module scopes claim no exports, so this is inert for
        // them.
        ...(scope.exportedBindings.length === 1 ? { exportName: scope.exportedBindings[0] } : {}),
      },
      branches: scope.branches,
      exits: scope.exits,
    })),
  });
};
