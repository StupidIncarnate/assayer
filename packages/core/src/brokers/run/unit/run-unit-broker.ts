/**
 * PURPOSE: Runs the derived cases for one file and returns the saved result — the single execution
 *   path, which BOTH the CLI and the desktop go through.
 *
 *   That singularity is the design, not an implementation detail: "run in the UI" and "run headless"
 *   cannot drift because they are not two runners, they are one broker producing one artifact that
 *   two surfaces read.
 *
 *   A case set with NO drivable entries never reaches Jest. There is nothing for it to discover, so
 *   invoking it can only fail — it refuses a suite with no `it()`, its `afterAll` never runs, and the
 *   artifact everything downstream reads is never written. The honest artifact is written here
 *   instead, and it is not empty: the file's logic is admitted on `undriven`. The alternative — a
 *   placeholder `it()` to keep Jest happy — is a fake passing test, which is the exact "reads as
 *   complete" lie this whole pipeline exists to refuse. Skipping the runner is also just faster: no
 *   compiler starts for a file with nothing to run.
 *
 *   The ORDER matters. The probe plan must be on disk before Jest starts, because the transformer
 *   looks it up by content hash while compiling — and a missing plan means "not part of the analyzed
 *   surface", which is silently correct for a dependency and silently wrong for a target. The run
 *   result is then read back from the artifact the shim wrote rather than from Jest's own reporting,
 *   so raw runner output never reaches a human.
 *
 *   The run loads core's run-time modules from the tree this broker was loaded from: TypeScript source
 *   when it runs from `src`, compiled output when it runs from `dist`. It runs the file in the module
 *   format `moduleFormatReadBroker` reads off the consumer's own config, so an ESM file runs as ESM.
 *
 * USAGE:
 * await runUnitBroker({ cacheDir, coreRoot, repoRoot, relPath, absPath, source, runId, analyzerContentHash });
 * // Returns { runId, relPath, cases: [{ status, observedPath, trace }], gaps, darkSpots, undriven }
 */
import { runResultContract } from '@assayer/shared/contracts';
import type { RunResult } from '@assayer/shared/contracts';

import { contentHashTransformer } from '../../../transformers/content-hash/content-hash-transformer';
import { runExecuteCasesBroker } from '../execute-cases/run-execute-cases-broker';
import { assembleShimTransformer } from '../../../transformers/assemble-shim/assemble-shim-transformer';
import { coreRuntimeTransformer } from '../../../transformers/core-runtime/core-runtime-transformer';
import { caseSetProjectionTransformer } from '../../../transformers/case-set-projection/case-set-projection-transformer';
import { harnessPathTransformer } from '../../../transformers/harness-path/harness-path-transformer';
import { probePlanProjectionTransformer } from '../../../transformers/probe-plan-projection/probe-plan-projection-transformer';
import { analyzeFileBroker } from '../../analyze/file/analyze-file-broker';
import { fileWalkBroker } from '../../file/walk/file-walk-broker';
import { composeCrossFileMapBroker } from '../../compose/cross-file-map/compose-cross-file-map-broker';
import { composeCrossFilePredicatesBroker } from '../../compose/cross-file-predicates/compose-cross-file-predicates-broker';
import { harnessRealizeBroker } from '../../harness/realize/harness-realize-broker';
import { paramTypeResolveBroker } from '../../param-type/resolve/param-type-resolve-broker';
import { stubRealizeBroker } from '../../stub/realize/stub-realize-broker';
import { stubOverlayLoadBroker } from '../../stub-overlay/load/stub-overlay-load-broker';
import { runCrossFileProbesBroker } from '../cross-file-probes/run-cross-file-probes-broker';
import { moduleFormatReadBroker } from '../../module-format/read/module-format-read-broker';
import { coreRuntimeStatics } from '../../../statics/core-runtime/core-runtime-statics';
import { ensureDir, pathExists, readFile, writeFile } from '#gateway/node/fs__promises';

export const runUnitBroker = async ({
  cacheDir,
  coreRoot,
  repoRoot,
  relPath,
  absPath,
  source,
  runId,
  analyzerContentHash,
}: {
  cacheDir: string;
  coreRoot: string;
  repoRoot: string;
  relPath: string;
  absPath: string;
  source: string;
  runId: string;
  analyzerContentHash: string;
}): Promise<RunResult> => {
  const runtime = coreRuntimeTransformer({ coreRoot, loadedFrom: __dirname });
  const walked = fileWalkBroker({ source, relPath, absPath });
  // First, the types: a parameter declared as an IMPORTED type is `any` in the hermetic walk, so the
  // fill seam refuses it and the entry is invoiced for an input Assayer can build perfectly well. This
  // resolves the declaration against the sibling on disk and re-projects the file from it, so every
  // overlay below reads real parameter types.
  const typed = paramTypeResolveBroker({
    analysis: analyzeFileBroker({ walked, relPath }),
    walked,
    root: repoRoot,
    relPath,
  });
  // A caller's opaque `if (helper(x))` guard over an IMPORTED predicate is composed here, at consume
  // time, against the sibling on disk — the same-file compose inside `analyzeFileBroker` refuses
  // imports because the per-file blob never reads another file. Applied before the case set is
  // projected, so the runnable cases and any unreachable-exit lint reflect the composed guard.
  const composed = composeCrossFilePredicatesBroker({
    analysis: typed,
    walked,
    root: repoRoot,
    relPath,
  });
  // Then the object-arrange overlay: an `if (config.mode === 'a')` the per-file walk admitted UNDRIVEN
  // is DRIVEN here from the merged stub view — the derived per-property demands combined with the
  // committed `assayer/stubs/` overlay, read fresh per run and NEVER persisted (the twin of compose).
  const realized = stubRealizeBroker({
    analysis: composed,
    walked,
    root: repoRoot,
    relPath,
    overlays: await stubOverlayLoadBroker({ repoRoot }),
  });
  // Then the cross-file-map fold: a surface mapping an IMPORTED function over an array param
  // (`items.map(bandReading)`) folds that sibling callee's branches into the surface's own case set,
  // against the sibling on disk — the same per-run sibling read as compose, and the array/element twin
  // of the inline-callback funnel `analyzeFileBroker` builds for a same-file callback.
  const mapped = composeCrossFileMapBroker({ analysis: realized, walked, root: repoRoot, relPath });
  // Last, the harness overlay: an entry whose input Assayer refused is DRIVEN here from the colocated
  // `<basename>.harness.ts`, read fresh per run and never persisted. It runs after the overlays above
  // because each of those can turn a refusal into something Assayer builds itself, and a harness may only
  // pay a debt that is still owed once everything derivable has been derived. `walked` is threaded so a
  // refusal owned by a funnelled or through-caller private (invoiced against its host) can be paid too —
  // it re-runs the same `follow-calls` classification the compile walk used, rather than leaving that
  // refusal open forever on this, the real run path.
  const analysis = harnessRealizeBroker({ analysis: mapped, root: repoRoot, relPath, walked });
  const contentHash = contentHashTransformer({ content: source });

  const probeDir = `${cacheDir}/probes`;
  const runDir = `${cacheDir}/runs/${runId}`;
  const caseSetPath = `${runDir}/cases.json`;
  const resultPath = `${runDir}/run.json`;
  const caseSet = caseSetProjectionTransformer({
    analysis,
    relPath,
    modulePath: absPath,
    // Where a colocated harness WOULD be, always: the projection names it only when some case actually
    // reaches for a supplied input, so the two facts cannot drift apart.
    harnessPath: `${repoRoot}/${harnessPathTransformer({ relPath })}`,
  });

  await ensureDir(probeDir);
  await ensureDir(runDir);

  await writeFile(caseSetPath, JSON.stringify(caseSet));

  // Nothing to discover means nothing to run: Jest refuses a suite with no `it()`, so handing it this
  // file could only fail. The artifact is written here instead — with every admission intact, because
  // "no drivable case" is a FINDING about the file, not an absence of one.
  if (caseSet.entries.length === 0) {
    const result = runResultContract.parse({
      runId,
      relPath,
      cases: [],
      gaps: caseSet.gaps,
      darkSpots: caseSet.darkSpots,
      undriven: caseSet.undriven,
      lints: caseSet.lints,
    });

    await writeFile(resultPath, JSON.stringify(result));

    return result;
  }

  // Written FIRST and keyed by content hash: the transformer looks the plan up while compiling, so a
  // stale read is unrepresentable rather than merely unlikely.
  await writeFile(
    `${probeDir}/${contentHash}.json`,
    JSON.stringify(probePlanProjectionTransformer({ walked, relPath, contentHash })),
  );

  // Every SIBLING a cross-file-map fold reaches gets its plan written too, keyed on ITS content hash:
  // jest compiles the imported callee when this target requires it, and the transformer only
  // instruments a file whose plan is already on disk — so this is what makes the folded sibling exits
  // fire into `__P` and be observable, exactly as an inline callback's are. A no-op for a target with
  // no such reach.
  await runCrossFileProbesBroker({ walked, root: repoRoot, relPath, probeDir });

  // The file runs in the module format the consumer's own config gives it, read through TypeScript with
  // the owning tsconfig and the nearest package.json, so an ESM file runs as ESM and a CommonJS file as
  // CommonJS.
  const format = moduleFormatReadBroker({ absPath });

  await writeFile(
    `${runDir}/${coreRuntimeStatics.shimFile[format]}`,
    assembleShimTransformer({
      format,
      caseSetPath,
      interpretCaseModule: runtime.interpretCaseModule,
      resolveEntryModule: runtime.resolveEntryModule,
      probeRuntimeModule: runtime.probeRuntimeModule,
      harnessModule: runtime.harnessModule,
      registrarPath: runtime.registrar,
      resultPath,
      runId,
    }),
  );

  await runExecuteCasesBroker({ runDir, repoRoot, probeDir, runtime, analyzerContentHash, format });

  // A FAILING case still writes the artifact — the shim's afterAll sees to that — so a missing one
  // means the runner itself died and the run is over with nothing to report. Said plainly here rather
  // than surfaced as an ENOENT on a cache path nobody chose to care about: the reader's file is fine,
  // Assayer's runner is not, and only one of those is actionable.
  if (!(await pathExists(resultPath))) {
    throw new Error(
      `assayer: the runner crashed while running ${relPath} and wrote no result.\n` +
        `  ${String(caseSet.entries.length)} drivable entr${caseSet.entries.length === 1 ? 'y was' : 'ies were'} ` +
        'handed to Jest, which exited without recording a verdict for any of them. That is a fault in ' +
        'Assayer, not a failing test in your code.\n' +
        `  The generated shim and the cases it was given are on disk at ${runDir} — running Jest against ` +
        'that directory reproduces the crash. Please report it with that output.',
    );
  }

  // Read back the ARTIFACT, not Jest's reporting: the verdict is already in it, and raw runner output
  // is never what a human sees.
  return runResultContract.parse(JSON.parse((await readFile(resultPath))));
};
