import { registerMock } from '@dungeonmaster/testing/register-mock';

import { runExecuteCasesBrokerProxy } from '../execute-cases/run-execute-cases-broker.proxy';
import { analyzeFileBrokerProxy } from '../../analyze/file/analyze-file-broker.proxy';
import { composeCrossFileMapBrokerProxy } from '../../compose/cross-file-map/compose-cross-file-map-broker.proxy';
import { composeCrossFilePredicatesBrokerProxy } from '../../compose/cross-file-predicates/compose-cross-file-predicates-broker.proxy';
import { harnessRealizeBrokerProxy } from '../../harness/realize/harness-realize-broker.proxy';
import { paramTypeResolveBrokerProxy } from '../../param-type/resolve/param-type-resolve-broker.proxy';
import { stubRealizeBrokerProxy } from '../../stub/realize/stub-realize-broker.proxy';
import { stubOverlayLoadBroker } from '../../stub-overlay/load/stub-overlay-load-broker';
import { stubOverlayLoadBrokerProxy } from '../../stub-overlay/load/stub-overlay-load-broker.proxy';
import { runCrossFileProbesBrokerProxy } from '../cross-file-probes/run-cross-file-probes-broker.proxy';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';

// Every scenario names the run it stages. A path no scenario staged reaches an unstaged call, which
// throws.
export const runUnitBrokerProxy = (): {
  // The run directory, the case set, the target's probe plan, the shim and the run artifact a run may
  // write, each staged to succeed at its exact path. `contentHash` names the probe plan, which is keyed
  // on the source's content hash.
  setupWrites: ({
    cacheDir,
    runId,
    contentHash,
  }: {
    cacheDir: string;
    runId: string;
    contentHash: string;
  }) => void;
  setupSavedRun: ({ cacheDir, runId, run }: { cacheDir: string; runId: string; run: unknown }) => void;
  runnerWroteNothing: ({ cacheDir, runId }: { cacheDir: string; runId: string }) => void;
  runnerWasInvoked: () => boolean;
  // Every path this run wrote under the cache directory, in call order — the case set, the target's
  // probe plan, each mapped sibling's plan, then the shim. A test asking WHICH files a run leaves behind
  // names the whole list. That also pins what a run does NOT write: a file with nothing drivable skips
  // the probe plan and the shim entirely.
  writtenPaths: ({ cacheDir }: { cacheDir: string }) => unknown[];
  // Answers for the asked-for path only, for a test that already names the exact file it means.
  writtenContentAt: ({ path }: { path: string }) => unknown;
  // Answers for the LAST write whose path contains the substring. A run writes several files into one
  // run directory, and a caller that only knows the file's BASE name — `cases.json`, rather than the
  // whole `<cacheDir>/runs/<runId>/cases.json` — reaches it this way.
  writtenContentFor: ({ cacheDir, pathIncludes }: { cacheDir: string; pathIncludes: string }) => unknown;
  readDenied: ({ cacheDir, runId }: { cacheDir: string; runId: string }) => void;
  // The colocated harness file this run would read — real disk I/O a unit test has none of, so only
  // the two reads underneath it are staged. Everything above them (the gate, the load, `derive-cases`,
  // `follow-calls`) runs REAL, which is what lets a test prove `walked` reaching this overlay rather
  // than merely that the overlay was called.
  setupHarness: ({ path, source }: { path: string; source: string }) => void;
  setupNoHarness: ({ path }: { path: string }) => void;
} => {
  analyzeFileBrokerProxy();
  // The imported-type resolution runs REAL with its sibling resolve staged to "no sibling", so it is a
  // same-reference no-op for a target whose parameters name no resolvable reference.
  paramTypeResolveBrokerProxy();
  composeCrossFilePredicatesBrokerProxy();
  stubRealizeBrokerProxy();
  // The cross-file-map fold and its sibling-instrumentation run REAL; their sibling resolve is staged to
  // "no sibling", so both are same-reference no-ops for a target with no cross-file map reach.
  composeCrossFileMapBrokerProxy();
  // The harness overlay runs REAL. A test that stages a harness via setupHarness below reaches it; one
  // that stages nothing reaches an unstaged read of the colocated file.
  const harness = harnessRealizeBrokerProxy();
  runCrossFileProbesBrokerProxy();
  // The overlay load is mocked wholesale to an EMPTY overlay: reading committed corrections off disk is
  // I/O a unit test does not stage, so stub-realize sees no correction and its object-arrange overlay is
  // a same-reference no-op. The child proxy satisfies structure; the direct registerMock is the intercept.
  stubOverlayLoadBrokerProxy();
  const overlayLoadHandle = registerMock({ fn: stubOverlayLoadBroker });
  overlayLoadHandle.calledWith([]).resolves([]);

  const runner = runExecuteCasesBrokerProxy();
  const dirs = ensureDirProxy();
  const exists = pathExistsProxy();
  const writes = writeFileProxy();
  const reads = readFileProxy();

  return {
    setupWrites: ({
      cacheDir,
      runId,
      contentHash,
    }: {
      cacheDir: string;
      runId: string;
      contentHash: string;
    }): void => {
      const runDir = `${cacheDir}/runs/${runId}`;
      dirs.succeeds({ path: `${cacheDir}/probes` });
      dirs.succeeds({ path: runDir });
      writes.succeeds({ path: `${runDir}/cases.json` });
      writes.succeeds({ path: `${cacheDir}/probes/${contentHash}.json` });
      writes.succeeds({ path: `${runDir}/assayer.test.js` });
      writes.succeeds({ path: `${runDir}/run.json` });
    },
    setupSavedRun: ({ cacheDir, runId, run }: { cacheDir: string; runId: string; run: unknown }): void => {
      const path = `${cacheDir}/runs/${runId}/run.json`;
      exists.present({ path });
      reads.returns({ path, contents: JSON.stringify(run) });
    },
    // The runner ran and left no artifact — it crashed, which is the ONE case that is Assayer's fault
    // rather than a verdict about the file.
    runnerWroteNothing: ({ cacheDir, runId }: { cacheDir: string; runId: string }): void => {
      exists.missing({ path: `${cacheDir}/runs/${runId}/run.json` });
    },
    runnerWasInvoked: (): boolean => runner.wasInvoked(),
    writtenPaths: ({ cacheDir }: { cacheDir: string }): unknown[] =>
      writes
        .getCallsFor({
          path: (value: unknown): boolean => String(value).startsWith(`${cacheDir}/`),
        })
        .map((call) => call[0]),
    writtenContentAt: ({ path }: { path: string }): unknown => writes.writtenContentsFor({ path }),
    writtenContentFor: ({ cacheDir, pathIncludes }: { cacheDir: string; pathIncludes: string }): unknown =>
      writes
        .getCallsFor({
          path: (value: unknown): boolean =>
            String(value).startsWith(`${cacheDir}/`) && String(value).includes(pathIncludes),
        })
        .at(-1)?.[1],
    // The read-back is deliberately unwrapped -- no try/catch -- so a filesystem rejection (EACCES and
    // the like) propagates to the caller unmodified. This stages that rejection.
    readDenied: ({ cacheDir, runId }: { cacheDir: string; runId: string }): void => {
      const path = `${cacheDir}/runs/${runId}/run.json`;
      exists.present({ path });
      reads.denied({ path });
    },
    setupHarness: ({ path, source }: { path: string; source: string }): void => {
      harness.setupHarness({ path, source });
    },
    setupNoHarness: ({ path }: { path: string }): void => {
      harness.setupNoHarness({ path });
    },
  };
};
