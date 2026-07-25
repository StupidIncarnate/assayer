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
 *   A PARTIAL harness keeps the debt. When some refused parameter is still unsupplied the entry derives no
 *   case, so the gap stays — but re-invoiced from the refusals that REMAIN, naming only what is still
 *   missing. Reprinting the original invoice would bill the reader for the input they just supplied.
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
import { fileAnalysisContract, relPathContract } from '@assayer/shared/contracts';
import type { FileAnalysis, SymbolName } from '@assayer/shared/contracts';

import { fsExistsSyncAdapter } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter';
import { fsReadFileSyncAdapter } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter';
import { typescriptHarnessGateAdapter } from '../../../adapters/typescript/harness-gate/typescript-harness-gate-adapter';
import { typescriptLoadHarnessAdapter } from '../../../adapters/typescript/load-harness/typescript-load-harness-adapter';
import { deriveCasesTransformer } from '../../../transformers/derive-cases/derive-cases-transformer';
import { harnessKeysTransformer } from '../../../transformers/harness-keys/harness-keys-transformer';
import { harnessPathTransformer } from '../../../transformers/harness-path/harness-path-transformer';
import { inputGapTransformer } from '../../../transformers/input-gap/input-gap-transformer';
import { undrivenBranchTransformer } from '../../../transformers/undriven-branch/undriven-branch-transformer';

export const harnessRealizeBroker = ({
  analysis,
  root,
  relPath,
}: {
  analysis: FileAnalysis;
  root: string;
  relPath: string;
}): FileAnalysis => {
  // A file that owes nothing cannot be paid, so nothing is read for it. A harness with no invoice behind
  // it is the ceremonial declaration this project refuses, and the compile stitch reports it as one.
  if (analysis.gaps.length === 0) {
    return analysis;
  }

  const harnessPath = `${root}/${String(harnessPathTransformer({ relPath: relPathContract.parse(relPath) }))}`;

  if (!fsExistsSyncAdapter({ path: harnessPath })) {
    return analysis;
  }

  const source = String(fsReadFileSyncAdapter({ path: harnessPath }));

  if (!typescriptHarnessGateAdapter({ source })) {
    return analysis;
  }

  const loaded = typescriptLoadHarnessAdapter({ source, fileName: harnessPath });

  if (!loaded.ok) {
    return analysis;
  }

  // The declared keys grouped by entry — the same inventory the cache records, read from the same load,
  // so the run cannot arrange a key the compile never saw.
  const declaredByEntry = harnessKeysTransformer({ declarations: loaded.declarations }).reduce(
    (acc, key) => acc.set(key.entry, (acc.get(key.entry) ?? new Set<SymbolName>()).add(key.param)),
    new Map<SymbolName, Set<SymbolName>>(),
  );

  const gappedNames = new Set(analysis.gaps.map((gap) => gap.name));

  // Each invoiced entry re-derived with what the harness supplies, narrowed to parameters the entry
  // actually DECLARES: a key naming something else is the compile stitch's P1 to report, and letting one
  // reach the derivation would arrange an argument the signature has no slot for.
  const realized = analysis.functions.map((fn) => {
    const declared = declaredByEntry.get(fn.entry.name);

    if (declared === undefined || !gappedNames.has(fn.entry.name)) {
      return { fn, result: undefined };
    }

    const supplied = fn.entry.params.filter((param) => declared.has(param.name)).map((param) => param.name);

    if (supplied.length === 0) {
      return { fn, result: undefined };
    }

    return {
      fn,
      result: deriveCasesTransformer({
        params: fn.entry.params,
        branches: fn.branches,
        exits: fn.exits,
        envDrivable: fn.entry.access.kind === 'module',
        // A supplied entry's cases differ from a derived one's in EXACTLY the harness binding, which
        // means every other axis has to be handed over unchanged. The entry's own return comparison is
        // one of them, and the ONLY axis a branchless predicate has: drop it and supplying an input
        // silently costs the reader a case, which is the lie this whole channel exists to end.
        ...(fn.predicateSignature === undefined ? {} : { returnPredicate: fn.predicateSignature }),
        harness: { entry: fn.entry.name, params: supplied },
      }),
    };
  });

  // A harness that reached no invoiced entry — every key names something else — leaves the analysis
  // exactly as it was, by reference. Re-parsing an unchanged model is how a "no-op" overlay comes to be
  // distinguishable from not running at all.
  if (realized.every(({ result }) => result === undefined)) {
    return analysis;
  }

  // An entry is PAID when nothing it needs is refused any more. Only then do its cases replace the empty
  // set a refusal leaves behind, and only then does its invoice come off the channel.
  const paid = new Set(
    realized.flatMap(({ fn, result }) => (result !== undefined && result.unfillable.length === 0 ? [fn.entry.name] : [])),
  );

  return fileAnalysisContract.parse({
    functions: realized.map(({ fn, result }) =>
      result === undefined || !paid.has(fn.entry.name)
        ? fn
        : {
            entry: fn.entry,
            branches: fn.branches,
            exits: fn.exits,
            cases: result.cases,
            ...(fn.predicateSignature === undefined ? {} : { predicateSignature: fn.predicateSignature }),
          },
    ),
    enrichment: analysis.enrichment,
    // Every gap this overlay did not pay, in place. A PARTIALLY supplied entry is re-invoiced from the
    // refusals that REMAIN, so the reader is billed for what is still missing and not for what they just
    // handed over.
    gaps: analysis.gaps.flatMap((gap) => {
      const entry = realized.find(({ fn }) => String(fn.entry.name) === String(gap.name));

      return entry?.result === undefined
        ? [gap]
        : inputGapTransformer({ entryName: entry.fn.entry.name, unfillable: entry.result.unfillable });
    }),
    darkSpots: analysis.darkSpots,
    // What the gap was suppressing, now that the gap is gone: a branch no case can steer is the entry's
    // remaining debt and says so itself. Nothing is duplicated — a gapped entry carries no undriven
    // admission at all, because `analyze-file-broker` dropped them under the precedence rule.
    undriven: [
      ...analysis.undriven,
      ...realized.flatMap(({ fn, result }) =>
        result === undefined || !paid.has(fn.entry.name)
          ? []
          : undrivenBranchTransformer({ entryName: fn.entry.name, undrivenBranches: result.undrivenBranches }),
      ),
    ],
    lints: analysis.lints,
    declaredTypes: analysis.declaredTypes,
  });
};
