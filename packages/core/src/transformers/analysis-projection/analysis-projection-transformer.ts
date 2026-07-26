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
 *     into an import (package/builtin resolve later, but the callee arm is `import`), a VALUE flow
 *     that binds an external as a value (`const separator = sep`, `const e = process.env`), or an
 *     ambient global USE that is a CALL made at MODULE LOAD time. Consuming something the file did not
 *     author is a consumption site that owes a case, exactly like a top-level branch owes one; a module
 *     that only touches its OWN local bindings is not — that local scope is already the entry. Every
 *     file has a module scope; almost none have testable top-level logic.
 *
 *   A global use rides `walked.globalUses` — flat and file-wide, never claimed by a scope (per
 *   `walk-facts-contract`) — so it alone cannot say whether it ran at import time or only when some
 *   OTHER, uncalled function later runs: a `console.log` inside a named, exported-but-uncalled function
 *   is understood perfectly and simply never fires on import. What decides it is the `scopePath` the
 *   use carries (the walk's `context.scopePath` where it was recorded, which EXTENDS at a function
 *   boundary): a use whose scope is the module's own, or a function-like scope MODULE LOAD itself
 *   reaches — an IIFE invoked in place, or an inline callback an unconditional top-level call invokes,
 *   recursively — is import-time code; a use nested inside any scope that needs an EXTERNAL call
 *   (a named export, a method, a returned closure) is not, however many private helpers separate it
 *   from the module. A class contributes only a NAMING segment to `scopePath`, no scope of its own, so
 *   a use recorded inside a property initializer or a static block names a scope this projection never
 *   opened and is honestly excluded rather than guessed at.
 *
 * USAGE:
 * analysisProjectionTransformer({ walked });
 * // Returns a validated AnalysisExtractResult: { success: true, functions: [...] }
 */
import { analysisExtractResultContract } from '../../contracts/analysis-extract-result/analysis-extract-result-contract';
import type { AnalysisExtractResult } from '../../contracts/analysis-extract-result/analysis-extract-result-contract';
import type { WalkFileResult } from '../../contracts/walk-file-result/walk-file-result-contract';
import { moduleScopeStatics } from '../../statics/module-scope/module-scope-statics';

export const analysisProjectionTransformer = ({ walked }: { walked: WalkFileResult }): AnalysisExtractResult => {
  if (!walked.success) {
    return analysisExtractResultContract.parse({ success: false, error: walked.error });
  }

  // The scopes MODULE LOAD itself reaches: the module scope, plus every function-like scope reached
  // without an external call — invoked IN PLACE (an IIFE, `invokedFns`) or passed as a CALLBACK to a
  // call that itself runs unconditionally (`guardPath.length === 0`) from a scope ALREADY in this set.
  // `scopePath.length` is a function-like scope's NESTING DEPTH — one more than its parent's — so
  // folding shallowest-first proves each scope's parent is already decided before the scope itself is
  // checked, in ONE pass; a callback nested inside an IIFE is still found, since the IIFE (shallower)
  // folds first. A NAMED (exported), method, constructor, or default-export scope never joins the set:
  // reaching one needs a call from OUTSIDE the module's own load path.
  const moduleScopeKey = JSON.stringify([moduleScopeStatics.name]);
  const moduleLoadReached = [...walked.scopes]
    .sort((left, right) => left.scopePath.length - right.scopePath.length)
    .reduce((reached, scope) => {
      const scopeKey = JSON.stringify(scope.scopePath);
      const parentKey = JSON.stringify(scope.scopePath.slice(0, -1));
      if (scope.kind !== 'function' || !reached.has(parentKey)) {
        return reached;
      }
      const invokedInPlace = walked.invokedFns.some((entry) => String(entry.startLine) === String(scope.startLine));
      const calledBackUnconditionally = walked.scopes.some(
        (holder) =>
          reached.has(JSON.stringify(holder.scopePath)) &&
          holder.calls.some(
            (call) =>
              call.guardPath.length === 0 &&
              call.args.some((arg) => arg.kind === 'callback' && String(arg.startLine) === String(scope.startLine)),
          ),
      );
      return invokedInPlace || calledBackUnconditionally ? new Set(reached).add(scopeKey) : reached;
    }, new Set([moduleScopeKey]));

  // A module CONSUMES an external when it calls an import, binds an external as a VALUE, or when the
  // file makes an ambient global CALL that runs at module load — the import call and the value flow
  // ride the scope's own claimed `calls`/`valueUses`, already scoped to this exact module scope; the
  // global call is checked against the reached set above, since its own channel is flat. A module that
  // only touches its OWN local bindings is not consuming: that local scope is the entry.
  const entries = walked.scopes.filter(
    (scope) =>
      (scope.kind === 'function' && scope.exported) ||
      (scope.kind === 'module' &&
        (scope.branches.length > 0 ||
          scope.calls.some((call) => call.callee.target === 'import') ||
          // Every value use is an import/global/local reference the walk resolved — an external data
          // flow — so any of them is a consumption site.
          scope.valueUses.length > 0 ||
          walked.globalUses.some((use) => use.called && moduleLoadReached.has(JSON.stringify(use.scopePath))))),
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
      // Carried onto the entry so derive-cases can split a branchless predicate's true/false return
      // into two cases. Present only for a single-comparison-return body; inert for everything else.
      ...(scope.predicateSignature === undefined ? {} : { predicateSignature: scope.predicateSignature }),
    })),
  });
};
