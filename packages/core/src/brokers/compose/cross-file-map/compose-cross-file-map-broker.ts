/**
 * PURPOSE: Folds an IMPORTED function's branches into the host that maps it over an array param — the
 *   CROSS-FILE twin of the inline-callback funnel `follow-calls` builds inside `analyzeFileBroker`. A
 *   surface like `bandReadings(items){ return items.map(bandReading) }`, where `bandReading` is
 *   imported, cannot reach the callee without being called, so the callee's branches must FUNNEL into
 *   the surface's own case set exactly as an inline `(n) => …` callback does — except the callback
 *   scope comes from the sibling file, so its exits keep the SIBLING's own coverage ids (rooted at the
 *   sibling module scope and the callee name) and each folded case predicts `[siblingCallbackExit, surfaceExit]`.
 *
 *   It is a consume-time OVERLAY, never baked into the per-file blob (the blob never reads another
 *   file): for each cross-file-map reach it resolves the imported callee to its sibling scope on disk
 *   (the same per-run sibling read compose and stub-realize do), then hands the host and that scope to
 *   `funnel-cases` — the SAME fold, cartesian across every callee one host maps. The host entry's plain
 *   derived cases are REPLACED with the funnel cases, and the sibling's exits are unioned into the
 *   entry's `exits` so the interpreter can observe the folded multi-file path. Every other function, and
 *   every admission, rides through untouched. A file with no cross-file-map reach, or a callee that does
 *   not resolve to an in-repo sibling, is a same-reference pass-through that folds nothing.
 *
 * USAGE:
 * composeCrossFileMapBroker({ analysis, walked, root: '/repo', relPath: 'src/cross-file-map.ts' });
 * // Returns the FileAnalysis with each cross-file map host's cases folded to the sibling callee's branches
 */
import { fileAnalysisContract } from '@assayer/shared/contracts';
import type { FileAnalysis, SymbolName } from '@assayer/shared/contracts';

import type { ScopeRecord } from '../../../contracts/scope-record/scope-record-contract';
import type { WalkFileResult } from '../../../contracts/walk-file-result/walk-file-result-contract';
import { tsconfigReadBroker } from '../../tsconfig/read/tsconfig-read-broker';
import { crossFileMapReachesTransformer } from '../../../transformers/cross-file-map-reaches/cross-file-map-reaches-transformer';
import { funnelCasesTransformer } from '../../../transformers/funnel-cases/funnel-cases-transformer';
import { inputGapTransformer } from '../../../transformers/input-gap/input-gap-transformer';
import { resolveSiblingCalleeBroker } from '../../resolve-sibling/callee/resolve-sibling-callee-broker';

export const composeCrossFileMapBroker = ({
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

  const reaches = crossFileMapReachesTransformer({ walked });

  if (reaches.length === 0) {
    return analysis;
  }

  const { options } = tsconfigReadBroker({ searchPath: root });
  const containingFile = `${root}/${relPath}`;

  // Each reach resolved to its sibling callee SCOPE — the exported function the specifier names. A
  // specifier that does not resolve to an in-repo sibling, or a sibling that exports no such function,
  // drops out here and folds nothing.
  const resolved = reaches.flatMap((reach) => {
    const sibling = resolveSiblingCalleeBroker({ specifier: String(reach.specifier), containingFile, root, options });

    if (!sibling?.walked.success) {
      return [];
    }

    const callee = sibling.walked.scopes.find(
      (scope) => scope.exported && String(scope.name) === String(reach.importedName),
    );

    return callee === undefined ? [] : [{ host: reach.host, arrayParam: reach.arrayParam, callee }];
  });

  if (resolved.length === 0) {
    return analysis;
  }

  // Grouped by the host each callee maps into, in first-seen order — a host mapping SEVERAL imported
  // callees over distinct array params funnels them ALL into ONE case set (the cartesian `funnel-cases`
  // builds), never one funnel per callee colliding on the same host.
  const groups: { host: ScopeRecord; callbacks: { callback: ScopeRecord; arrayParam: SymbolName }[] }[] = [];
  resolved.forEach((entry) => {
    const existing = groups.find((group) => group.host === entry.host);

    if (existing === undefined) {
      groups.push({ host: entry.host, callbacks: [{ callback: entry.callee, arrayParam: entry.arrayParam }] });
      return;
    }

    existing.callbacks.push({ callback: entry.callee, arrayParam: entry.arrayParam });
  });

  const folded = analysis.functions.map((fn) => {
    const group = groups.find(
      (candidate) =>
        String(candidate.host.name) === String(fn.entry.name) && String(candidate.host.startLine) === String(fn.entry.line),
    );

    if (group === undefined) {
      return { fn, refusals: [], hasCases: fn.cases.length > 0 };
    }

    const funnel = funnelCasesTransformer({ surface: group.host, callbacks: group.callbacks });

    // A REFUSED fold replaces the host's cases with NONE — `funnel.cases` is what `fn.cases` becomes
    // below, so a refusal's `hasCases` must read THAT outcome, never the host's own pre-fold derivation
    // (a branchless `return items.map(bandReading)` surface derives a trivial case of its own that the
    // fold discards, and reporting it here would claim a case the final analysis does not carry).
    if (funnel.cases.length === 0) {
      return { fn, refusals: funnel.unfillable, hasCases: false };
    }

    // The host entry's own exit unioned with the sibling callees' exits its folded cases path through,
    // deduped by coverage id — the cross-file twin of the funnel exit union `analyze-file-broker` adds,
    // so the interpreter observes the sibling exit that precedes the surface's return.
    const exits = [
      ...new Map([
        ...fn.exits.map((exit) => [String(exit.coverageId), exit] as const),
        ...group.callbacks.flatMap(({ callback }) => callback.exits.map((exit) => [String(exit.coverageId), exit] as const)),
      ]).values(),
    ];

    return {
      fn: {
        entry: fn.entry,
        branches: fn.branches,
        exits,
        cases: funnel.cases,
        ...(fn.predicateSignature === undefined ? {} : { predicateSignature: fn.predicateSignature }),
      },
      refusals: funnel.unfillable,
      hasCases: true,
    };
  });

  // A parameter the SIBLING callee declares and the fill seam refuses is the host's invoice to carry: the
  // host is the only entry the fold leaves, so a refusal filed nowhere is a surface that quietly derives
  // less than the file says. It is skipped for a host the analysis ALREADY invoiced — one entry owes one
  // gap, and its own refusals are stated there.
  const gappedNames = new Set(analysis.gaps.map((gap) => String(gap.name)));
  const foldedGaps = folded.flatMap(({ fn, refusals, hasCases }) =>
    gappedNames.has(String(fn.entry.name))
      ? []
      : inputGapTransformer({ entryName: fn.entry.name, unfillable: refusals, hasCases }),
  );
  const foldedGapNames = new Set(foldedGaps.map((gap) => String(gap.name)));

  return fileAnalysisContract.parse({
    functions: folded.map(({ fn }) => fn),
    enrichment: analysis.enrichment,
    gaps: [...analysis.gaps, ...foldedGaps],
    darkSpots: analysis.darkSpots,
    // The same precedence `analyze-file-broker` applies: an entry that has just gained an input gap owes
    // one next action, so its undriven admission — advice about a call that cannot be made yet — goes.
    undriven: analysis.undriven.filter((entry) => !foldedGapNames.has(String(entry.name))),
    lints: analysis.lints,
    declaredTypes: analysis.declaredTypes,
    declaringScopes: analysis.declaringScopes,
  });
};
