/**
 * PURPOSE: Pays an input GAP with the colocated harness that answers it — the consume-time overlay that
 *   turns "Assayer cannot construct this input" into real, runnable cases. The TWIN of `stub-realize`:
 *   applied where a run is consumed, never baked into the per-file blob, and re-reading the harness fresh
 *   per run so the declaration a case is derived from is the one the run will resolve.
 *
 *   For every entry the analysis invoiced, it re-derives with the parameters the harness supplies bound to
 *   HARNESS bindings — the same `derive-cases`, the same buckets, the same exits — so a supplied entry's
 *   cases differ from a derived one's in exactly one binding and nothing else. The binding carries a key
 *   path rather than a value, because the value is a live callback that only the run holds.
 *
 *   A refusal a driving route hit on a FUNNELLED PRIVATE's or a THROUGH-CALLER PRIVATE's own behalf is
 *   invoiced against the HOST that reader can drive (`on \`build\``), never that private's own name — so
 *   paying it is not a flat re-derivation over the invoicing entry's OWN params: it re-runs the SAME
 *   `follow-calls` classification the compile-time walk used, this time with the harness spec threaded to
 *   the declaring scope it names (`walked` — the raw scope records the classification needs, threaded in
 *   by the SAME callers that already load it for `stub-realize` and `compose-cross-file-map`). The
 *   binding then rides the rebase those routes already perform onto the CALLER's own argument slot — see
 *   `funnel-named-cases`/`through-caller-cases` for where — never a second derivation path. `walked` is
 *   OPTIONAL: a caller that has not yet threaded it gets exactly today's flat, entry-own-params-only
 *   payment (a funnelled or through-caller refusal stays open, re-invoiced honestly, never mis-bound).
 *
 *   A PARTIAL harness keeps the debt. When some refused parameter is still unsupplied the entry derives no
 *   case, so the gap stays — but re-invoiced from the refusals that REMAIN, naming only what is still
 *   missing. Reprinting the original invoice would bill the reader for the input they just supplied.
 *
 *   A TRAILING optional/rest parameter never raises a gap at all — `applied-params` truncates it before
 *   the fill seam ever refuses it, because a caller that supplies nothing for it makes a real call
 *   (§ its own doc). So an entry naming ONLY such a parameter is never in `gappedNames`, and eligibility
 *   below also asks a second question: does the harness answer a parameter this entry OWN param list
 *   carries that its OWN harness-unaware `applied-params` pass would have truncated? That is the same
 *   truncation `deriveCasesTransformer` runs internally, asked here ONE level up so a harness that
 *   targets a trailing parameter is not silently inert.
 *
 *   Clearing a gap REVIVES what it was suppressing. `analyze-file-broker` drops an entry's undriven
 *   admissions while it carries a gap, because "make the deciding value a parameter" is advice about a
 *   call that cannot happen. Once the input lands the call can happen, so the branches nothing can steer
 *   state themselves on their own line — which is exactly what the invoice's closing sentence promised.
 *
 *   Discovery is the same CONJUNCTION the compile stitch uses: the basename says which file a harness
 *   addresses, and the imported symbol decides whether it is one at all. A `*.harness.ts` that is some
 *   other tool's is silently not Assayer's; a harness whose body throws leaves the analysis untouched,
 *   because the compile stitch already reports that as a P1 and a second voice would say it twice.
 *
 * USAGE:
 * harnessRealizeBroker({ analysis, root: '/repo', relPath: 'src/audit.ts' });
 * // Returns the FileAnalysis with harness-supplied entries driven and their input gaps paid
 */
import { fileAnalysisContract, entryGapContract } from '@assayer/shared/contracts';
import type { EntryLabel, FileAnalysis, TypeText } from '@assayer/shared/contracts';

import { isAssayerHarnessGuard } from '../../../guards/is-assayer-harness/is-assayer-harness-guard';
import { harnessLoadBroker } from '../load/harness-load-broker';
import type { WalkFileResult } from '../../../contracts/walk-file-result/walk-file-result-contract';
import { appliedParamsTransformer } from '../../../transformers/applied-params/applied-params-transformer';
import { deriveCasesTransformer } from '../../../transformers/derive-cases/derive-cases-transformer';
import { followCallsTransformer } from '../../../transformers/follow-calls/follow-calls-transformer';
import { harnessKeysTransformer } from '../../../transformers/harness-keys/harness-keys-transformer';
import { harnessPathTransformer } from '../../../transformers/harness-path/harness-path-transformer';
import { inputGapTransformer } from '../../../transformers/input-gap/input-gap-transformer';
import { undrivenBranchTransformer } from '../../../transformers/undriven-branch/undriven-branch-transformer';
import { existsSync, readFileSync } from '#gateway/node/fs';

export const harnessRealizeBroker = ({
  analysis,
  root,
  relPath,
  walked,
}: {
  analysis: FileAnalysis;
  root: string;
  relPath: string;
  // The raw walk this file's compile pass produced — see PURPOSE above for why the funnel/through-caller
  // axis needs it and the flat entry-own-params axis does not.
  walked?: WalkFileResult;
}): FileAnalysis => {
  // A file that owes nothing cannot be paid, so nothing is read for it — UNLESS some entry carries a
  // trailing optional/rest parameter, which never raises a gap at all (see PURPOSE above) and so needs
  // its own, cheaper, I/O-free signal to justify reading the harness file. A harness with no invoice
  // behind it and no such parameter anywhere is the ceremonial declaration this project refuses, and the
  // compile stitch reports it as one.
  const hasOmittableParam = analysis.functions.some((fn) =>
    fn.entry.params.some((param) => param.optional === true || param.rest === true),
  );

  if (analysis.gaps.length === 0 && !hasOmittableParam) {
    return analysis;
  }

  const harnessPath = `${root}/${String(harnessPathTransformer({ relPath: relPath }))}`;

  if (!existsSync(harnessPath)) {
    return analysis;
  }

  const source = String(readFileSync(harnessPath));

  if (!isAssayerHarnessGuard({ source })) {
    return analysis;
  }

  const loaded = harnessLoadBroker({ source, fileName: harnessPath });

  if (!loaded.ok) {
    return analysis;
  }

  // The declared keys grouped by entry — the same inventory the cache records, read from the same load,
  // so the run cannot arrange a key the compile never saw.
  const declaredByEntry = harnessKeysTransformer({ declarations: loaded.declarations }).reduce(
    (acc, key) => acc.set(key.entry, (acc.get(key.entry) ?? new Set<string>()).add(key.param)),
    new Map<string, Set<string>>(),
  );

  const gappedNames = new Set(analysis.gaps.map((gap) => gap.name));

  // A name a harness may bind against beyond its own top-level gap: a DECLARING scope's refusal is
  // invoiced against its HOST, never against itself, so the host alone being gapped is not enough to
  // know the harness spec belongs to the private rather than the host.
  const declaringScopeNames = new Set(analysis.declaringScopes.map((scope) => String(scope.name)));

  // Threaded into the funnel/through-caller re-classification below — gated to names this file's OWN
  // gaps or declaring scopes already recognize as owing something, so a harness that also (redundantly)
  // names an unrelated, ungapped scope changes nothing for it.
  const followHarness = new Map(
    [...declaredByEntry.entries()].flatMap(([entryName, params]) =>
      gappedNames.has(entryGapContract.shape.name.parse(entryName)) || declaringScopeNames.has(String(entryName)) ? [[entryName, [...params]] as const] : [],
    ),
  );

  // The SAME `follow-calls` classification the compile-time walk ran, re-run with the harness threaded
  // to the declaring scope it names — never a second derivation path. Absent without `walked`, which
  // narrows every entry below to the flat, own-params-only payment §PURPOSE describes.
  const followed = walked?.success === true ? followCallsTransformer({ walked, harness: followHarness }) : undefined;
  const followedByName = new Map((followed?.followedEntries ?? []).map((fn) => [String(fn.entry.name), fn]));
  const funnelCasesByHost = new Map(
    (followed?.funnels ?? []).map((funnel) => [`${String(funnel.host)}@${String(funnel.hostLine)}`, funnel.cases]),
  );
  // A folded scope's or a through-caller pseudo-entry's OWN refusal still standing after `followHarness`
  // — the axis the flat per-entry derivation below cannot see, because it belongs to a DIFFERENT scope's
  // signature.
  const foldedRefusalsByEntry = new Map<string, { param: string; type: TypeText; owner?: EntryLabel }[]>();
  (followed?.refusals ?? []).forEach((refusal) => {
    const existing = foldedRefusalsByEntry.get(refusal.entryName) ?? [];
    existing.push({ param: refusal.param, type: refusal.type, ...(refusal.owner === undefined ? {} : { owner: refusal.owner }) });
    foldedRefusalsByEntry.set(refusal.entryName, existing);
  });

  // Every HOST whose funnelled scope just received a harness spec — the folded twin of "the harness
  // names this entry's own param", checked below beside it so a host gapped ONLY through a folded
  // scope's refusal is still worth touching even though the harness never names the host itself.
  const hostsWithFoldedHarness = new Set(
    walked?.success === true
      ? analysis.declaringScopes.filter((scope) => followHarness.has(scope.name)).map((scope) => scope.hostEntry)
      : [],
  );

  const realized = analysis.functions.map((fn) => {
    const entryName = fn.entry.name;
    const declared = declaredByEntry.get(entryName);
    const supplied = declared === undefined ? [] : fn.entry.params.filter((param) => declared.has(param.name)).map((param) => param.name);

    // The same harness-UNAWARE truncation `deriveCasesTransformer` runs internally, over THIS entry's
    // own full param list — so a name in `supplied` that is NOT in this set is exactly a trailing
    // optional/rest parameter the seam alone would drop, never a gapped one (a gap already reaches the
    // seam, so it stays in this set regardless).
    const ownApplied = new Set(appliedParamsTransformer({ params: fn.entry.params }).map((param) => String(param.name)));
    const trailingAnswered = supplied.filter((name) => !ownApplied.has(String(name)));

    // Nothing genuinely relevant to THIS entry was supplied — neither one of its own params nor a
    // folded scope it hosts — so it is left exactly as `analysis` already has it. A harness that
    // declares this entry's name under a param it does not have (a stale key `harness-validate` would
    // reject) is not "touched" either: re-deriving would reproduce the SAME content under a new
    // reference, which is not the no-op contract this overlay promises.
    const eligible =
      (gappedNames.has(entryName) && (supplied.length > 0 || hostsWithFoldedHarness.has(entryName))) ||
      trailingAnswered.length > 0;

    if (!eligible) {
      return { fn, touched: false as const };
    }

    // The entry's OWN params, re-derived exactly as today — a funnel host or a through-caller
    // pseudo-entry can be paid entirely through a DIFFERENT (declaring-scope) name, so this axis is
    // checked regardless of whether THIS entry's own name is the one the harness declared.
    const own = deriveCasesTransformer({
      params: fn.entry.params,
      branches: fn.branches,
      exits: fn.exits,
      envDrivable: fn.entry.access.kind === 'module',
      ...(fn.predicateSignature === undefined ? {} : { returnPredicate: fn.predicateSignature }),
      ...(supplied.length === 0 ? {} : { harness: { entry: entryName, params: supplied } }),
    });

    const foldedUnfillable = foldedRefusalsByEntry.get(entryName) ?? [];
    const unfillable = [...own.unfillable, ...foldedUnfillable];

    if (unfillable.length > 0) {
      return { fn, touched: true as const, unfillable, undrivenBranches: [] as ReturnType<typeof deriveCasesTransformer>['undrivenBranches'] };
    }

    const followedEntry = followedByName.get(String(entryName));
    const funnelCases = funnelCasesByHost.get(`${String(entryName)}@${String(fn.entry.line)}`);

    // A through-caller pseudo-entry's cases are only sound once REBASED onto its caller's own argument
    // slots — `followedEntry.cases` IS that rebase, fresh from the SAME transformer the compile walk
    // used. A funnel host's cases are the fresh funnel fold; anything else is the flat re-derivation
    // above, unchanged from today. `branches`/`exits` stay the file's OWN (already composed by any
    // upstream overlay) — only `cases` and the predicate axis move.
    const paidCases = followedEntry === undefined ? (funnelCases ?? own.cases) : followedEntry.cases;
    const paidPredicate = followedEntry?.predicateSignature ?? fn.predicateSignature;

    // A funnel host's exits gain whatever the private's own exits its fresh cases now path through —
    // the same union `analyze-file-broker` builds for an ungapped funnel, absent until now because the
    // refused funnel derived zero cases and so had nothing to union in.
    const exitByCoverageId = new Map(
      (walked?.success === true ? walked.scopes : []).flatMap((scope) => scope.exits.map((exit) => [String(exit.coverageId), exit] as const)),
    );
    const paidExits =
      funnelCases === undefined
        ? fn.exits
        : [
            ...new Map([
              ...fn.exits.map((exit) => [String(exit.coverageId), exit] as const),
              ...paidCases.flatMap((testCase) =>
                testCase.reachesPath.flatMap((coverageId) => {
                  const exit = exitByCoverageId.get(String(coverageId));
                  return exit === undefined ? [] : [[String(coverageId), exit] as const];
                }),
              ),
            ]).values(),
          ];

    return {
      fn: {
        entry: fn.entry,
        branches: fn.branches,
        exits: paidExits,
        cases: paidCases,
        ...(paidPredicate === undefined ? {} : { predicateSignature: paidPredicate }),
      },
      touched: true as const,
      unfillable: [] as { param: string; type: TypeText; owner?: EntryLabel }[],
      undrivenBranches: own.undrivenBranches,
    };
  });

  // A harness that reached no invoiced entry — every key names something else — leaves the analysis
  // exactly as it was, by reference. Re-parsing an unchanged model is how a "no-op" overlay comes to be
  // distinguishable from not running at all.
  if (!realized.some((entry) => entry.touched)) {
    return analysis;
  }

  // An entry is PAID when nothing it needs — its own params, or a folded scope's — is refused any more.
  const paidNames = new Set(
    realized.flatMap((entry) => (entry.touched && entry.unfillable.length === 0 ? [String(entry.fn.entry.name)] : [])),
  );

  return fileAnalysisContract.parse({
    functions: realized.map((entry) => entry.fn),
    enrichment: analysis.enrichment,
    // Every gap this overlay did not fully pay, re-invoiced from what remains. A PARTIALLY supplied
    // entry is billed for exactly what is still missing, never the original invoice repeated.
    gaps: analysis.gaps.flatMap((gap) => {
      const entry = realized.find((candidate) => String(candidate.fn.entry.name) === String(gap.name));

      return entry?.touched === true ? inputGapTransformer({ entryName: entry.fn.entry.name, unfillable: entry.unfillable }) : [gap];
    }),
    darkSpots: analysis.darkSpots,
    // What each paid gap was suppressing, now that the gap is gone: a branch no case can steer is the
    // entry's remaining debt and says so itself. Nothing is duplicated — a gapped entry carries no
    // undriven admission at all, because `analyze-file-broker` dropped them under the precedence rule.
    undriven: [
      ...analysis.undriven,
      ...realized.flatMap((entry) =>
        entry.touched && paidNames.has(String(entry.fn.entry.name))
          ? undrivenBranchTransformer({ entryName: entry.fn.entry.name, undrivenBranches: entry.undrivenBranches })
          : [],
      ),
    ],
    lints: analysis.lints,
    declaredTypes: analysis.declaredTypes,
    // A structural fact about the file, not an admission this overlay revises — a private stays folded
    // into its host whether or not the harness above just paid its refusal.
    declaringScopes: analysis.declaringScopes,
  });
};
