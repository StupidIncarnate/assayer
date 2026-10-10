/**
 * PURPOSE: Composes each caller's opaque call-guard with the CROSS-FILE predicate it calls — the
 *   consume-time overlay that same-file compose (which runs inside `analyzeFileBroker` and refuses
 *   `import` callees) leaves open. A branch whose whole condition is a lone `truthy` leaf over an
 *   imported call (`if (exceedsLimit(size))`) carries no arithmetic the derive-cases engine can act
 *   on, so both arms derive identical values and one silently fails. This joins that leaf back to the
 *   call site it came from (by the position both record), resolves the `import` callee to its sibling
 *   definition, walks that sibling once to read its published predicate signature, and swaps the leaf
 *   for the callee's own comparison rebased onto the argument the caller passed. The derive-cases
 *   engine then yields the sound cases, and a guard path whose thresholds contradict surfaces as an
 *   unreachable-exit lint.
 *
 *   It is an OVERLAY, applied where a run is consumed, never inside the per-file blob: the persisted
 *   blob stays child-independent (it never reads another file), so resolving the sibling is done here,
 *   per run, against the repo on disk. It changes ONLY a caller's branch conditions and the cases,
 *   lints, and branch-level undriven admissions those imply — a guard rebased onto a caller param is
 *   now steerable, so the leaf the per-file view admitted undriven drops out. The branch coverage ids,
 *   kinds, line spans, exits, enrichment, dark spots, and whole-module/private undriven admissions are
 *   preserved, so the exits keyed under each branch still join. Every
 *   precondition that fails is a silent no-op: a non-truthy leaf, a leaf with no call position, a
 *   package/builtin/unresolved callee, a sibling that published no predicate signature, or a signature
 *   whose operand the caller did not pass straight through all leave the branch as the walk read it. A
 *   file with no composable branch touches no disk.
 *
 * USAGE:
 * composeCrossFilePredicatesBroker({ analysis, walked, root: '/repo', relPath: 'src/upload.ts' });
 * // Returns the FileAnalysis with cross-file call-guards composed, cases re-derived, and any
 * // unreachable-exit lint appended
 */
import { moduleEntryLabelTransformer } from '@assayer/shared/transformers';
import { branchNodeContract, fileAnalysisContract } from '@assayer/shared/contracts';
import type { FileAnalysis } from '@assayer/shared/contracts';

import type { WalkFileResult } from '../../../contracts/walk-file-result/walk-file-result-contract';
import { callArgBindingsTransformer } from '../../../transformers/call-arg-bindings/call-arg-bindings-transformer';
import { deriveCasesTransformer } from '../../../transformers/derive-cases/derive-cases-transformer';
import { fileEnrichmentTransformer } from '../../../transformers/file-enrichment/file-enrichment-transformer';
import { rebasePredicateConditionTransformer } from '../../../transformers/rebase-predicate-condition/rebase-predicate-condition-transformer';
import { undrivenBranchTransformer } from '../../../transformers/undriven-branch/undriven-branch-transformer';
import { unreachableLintTransformer } from '../../../transformers/unreachable-lint/unreachable-lint-transformer';
import { resolveSiblingCalleeBroker } from '../../resolve-sibling/callee/resolve-sibling-callee-broker';

export const composeCrossFilePredicatesBroker = ({
  analysis,
  walked,
  root,
  relPath,
}: {
  analysis: FileAnalysis;
  walked: WalkFileResult;
  root: string;
  relPath: string;
}): FileAnalysis => {
  if (!walked.success) {
    return analysis;
  }

  // The caller's calls, keyed by the scope that makes them — the same key the entry carries, so the
  // leaf-to-call join is a Map lookup, not a scan.
  const callsByScope = new Map(walked.scopes.map((scope) => [scope.scopePath.join('/'), scope.calls] as const));

  // Correlate each function's composable branches to the IMPORT call site they guard on — purely, no
  // disk yet. A candidate is a lone `truthy` leaf over a call whose position matches an `import`-target
  // call; anything else stays undefined and passes through unchanged.
  const perFunction = analysis.functions.map((fn) => {
    const calls = callsByScope.get(fn.entry.scopePath.join('/')) ?? [];

    return {
      fn,
      candidates: fn.branches.map((branch) => {
        const leaf = branch.condition;

        if (leaf.kind !== 'leaf' || leaf.predicate.kind !== 'truthy' || leaf.operandCallPosition === undefined) {
          return undefined;
        }

        const position = leaf.operandCallPosition;
        const call = calls.find(
          (candidate) => candidate.position.line === position.line && candidate.position.column === position.column,
        );

        return call?.callee.target === 'import' ? call : undefined;
      }),
    };
  });

  // A file with no imported-predicate guard is a pure pass-through: the persisted analysis is returned
  // as-is and no tsconfig, module resolution, or sibling file is ever read.
  if (!perFunction.some((entry) => entry.candidates.some((candidate) => candidate !== undefined))) {
    return analysis;
  }

  const containingFile = `${root}/${relPath}`;

  const composed = perFunction.map(({ fn, candidates }) => {
    const branches = fn.branches.map((branch, index) => {
      const candidate = candidates[index];

      if (candidate?.callee.target !== 'import') {
        return branch;
      }

      // Resolve the imported callee to its sibling on disk the way `tsc` does. Only a sibling INSIDE
      // this repo (not under node_modules) can be walked for its predicate — a package/builtin/
      // unresolved callee resolves to `undefined` here, so the leaf stays opaque.
      const sibling = resolveSiblingCalleeBroker({ specifier: String(candidate.callee.specifier), containingFile, root });

      if (!sibling?.walked.success) {
        return branch;
      }

      const importedName = String(candidate.callee.importedName);
      const callee = sibling.walked.scopes.find((scope) => scope.exported && String(scope.name) === importedName);

      // A callee that published no predicate signature (its body is not a single comparison return)
      // offers nothing to compose from, so a leaf that could not be composed anyway is left alone.
      if (callee?.predicateSignature === undefined) {
        return branch;
      }

      const { toCallerParam } = callArgBindingsTransformer({ calleeParams: callee.params, args: candidate.args });

      const rebased = rebasePredicateConditionTransformer({
        node: callee.predicateSignature,
        branchCoverageId: branch.coverageId,
        path: [],
        toCallerParam,
      });

      if (rebased === undefined) {
        return branch;
      }

      return branchNodeContract.parse({
        coverageId: branch.coverageId,
        kind: branch.kind,
        condition: rebased,
        startLine: branch.startLine,
        endLine: branch.endLine,
      });
    });

    // A function whose branches the compose left untouched keeps its persisted cases and owes no new
    // lint. Only a function with a rebased branch re-derives — so a same-file unreachable already
    // linted upstream is never re-counted here, and a composed guard path that now contradicts is.
    if (!branches.some((branch, index) => branch !== fn.branches[index])) {
      return { fn, lints: [], undriven: [], staleUndrivenKeys: [] };
    }

    const derived = deriveCasesTransformer({
      params: fn.entry.params,
      branches,
      exits: fn.exits,
      envDrivable: false,
      // The entry's own return comparison is an axis of its case set beside its branches, not one of
      // them — `(a, b) => a > 1 && b > 2` carries both — so rebasing a guard must not drop it. Re-derive
      // without it and the entry silently loses the cases that told its two return values apart.
      ...(fn.predicateSignature === undefined ? {} : { returnPredicate: fn.predicateSignature }),
    });

    // The same label a same-file lint shows: a module scope reads by its file/export label, a named
    // entry by its own name — computed exactly as `analyze-file-broker` does, so the two never disagree
    // about what the reader sees.
    const displayName =
      fn.entry.access.kind === 'module'
        ? moduleEntryLabelTransformer({ ...(fn.entry.exportName === undefined ? {} : { exportName: fn.entry.exportName }), relPath })
        : String(fn.entry.name);

    return {
      fn: {
        entry: fn.entry,
        branches,
        exits: fn.exits,
        cases: derived.cases,
        ...(fn.predicateSignature === undefined ? {} : { predicateSignature: fn.predicateSignature }),
      },
      lints: unreachableLintTransformer({ name: fn.entry.name, displayName, unreachableExits: derived.unreachableExits }),
      // The FRESH branch admissions the recomposed function owes — a guard rebased onto a caller param
      // is now steerable, so a leaf the per-file view admitted undriven drops out here.
      undriven: undrivenBranchTransformer({ entryName: fn.entry.name, undrivenBranches: derived.undrivenBranches }),
      // The keys of the STALE admissions the per-file analyze put on this function's branches — keyed by
      // name + branch line (rebasing preserves the line), so the reconciliation drops exactly those and
      // re-adds the fresh set above.
      staleUndrivenKeys: fn.branches.map((branch) => `${String(fn.entry.name)}#${String(branch.startLine)}`),
    };
  });

  // Only a re-derived function's branch admissions move: its stale per-file entries are dropped and its
  // fresh ones added. The whole-module and private admissions, and any branch admission on an untouched
  // function, ride through unchanged.
  const staleUndrivenKeys = new Set(composed.flatMap((entry) => entry.staleUndrivenKeys));

  return fileAnalysisContract.parse({
    functions: composed.map((entry) => entry.fn),
    // Re-derive enrichment from the RECOMPOSED functions: a rebased call-guard now carries its real
    // `size > 50` comparison, so its branch line enriches that operand's range rather than staying at
    // the entry-param row the opaque leaf left behind. Enrich the same DIRECT entries the analyze
    // broker does — a through-caller entry is a passthrough it never enriched.
    enrichment: fileEnrichmentTransformer({
      functions: composed.map((entry) => entry.fn).filter((fn) => fn.entry.access.kind !== 'through-caller'),
    }),
    // Rebasing a guard changes which BRANCHES are steerable, never which PARAMETERS can be built — the
    // signature is the same one the per-file derivation refused — so the gaps ride through untouched.
    gaps: analysis.gaps,
    darkSpots: analysis.darkSpots,
    undriven: [
      ...analysis.undriven.filter(
        (entry) => !staleUndrivenKeys.has(`${String(entry.name)}#${String(entry.startLine)}`),
      ),
      ...composed.flatMap((entry) => entry.undriven),
    ],
    lints: [
      ...analysis.lints.filter(
        (lint) =>
          !composed.some((c) =>
            c.lints.some((l) => l.rule === lint.rule && l.startLine === lint.startLine && l.name === lint.name),
          ),
      ),
      ...composed.flatMap((entry) => entry.lints),
    ],
    // The declared object shapes are a per-file fact the compose overlay never touches — carried
    // through unchanged from the analyze the walk already produced.
    declaredTypes: analysis.declaredTypes,
    // A per-file fact the compose overlay never touches either — carried through unchanged.
    declaringScopes: analysis.declaringScopes,
  });
};
