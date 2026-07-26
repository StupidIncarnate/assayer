import { registerMock } from '@dungeonmaster/testing/register-mock';

import { cryptoSha256AdapterProxy } from '../../../adapters/crypto/sha256/crypto-sha256-adapter.proxy';
import { fsExistsAdapterProxy } from '../../../adapters/fs/exists/fs-exists-adapter.proxy';
import { fsMkdirAdapterProxy } from '../../../adapters/fs/mkdir/fs-mkdir-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { jestRunCliAdapterProxy } from '../../../adapters/jest/run-cli/jest-run-cli-adapter.proxy';
import { tsMorphWalkFileAdapterProxy } from '../../../adapters/ts-morph/walk-file/ts-morph-walk-file-adapter.proxy';
import { analyzeFileBrokerProxy } from '../../analyze/file/analyze-file-broker.proxy';
import { composeCrossFileMapBrokerProxy } from '../../compose/cross-file-map/compose-cross-file-map-broker.proxy';
import { composeCrossFilePredicatesBrokerProxy } from '../../compose/cross-file-predicates/compose-cross-file-predicates-broker.proxy';
import { harnessRealizeBrokerProxy } from '../../harness/realize/harness-realize-broker.proxy';
import { paramTypeResolveBrokerProxy } from '../../param-type/resolve/param-type-resolve-broker.proxy';
import { stubRealizeBrokerProxy } from '../../stub/realize/stub-realize-broker.proxy';
import { stubOverlayLoadBroker } from '../../stub-overlay/load/stub-overlay-load-broker';
import { stubOverlayLoadBrokerProxy } from '../../stub-overlay/load/stub-overlay-load-broker.proxy';
import { runCrossFileProbesBrokerProxy } from '../cross-file-probes/run-cross-file-probes-broker.proxy';

export const runUnitBrokerProxy = (): {
  setupSavedRun: ({ run }: { run: unknown }) => void;
  runnerWroteNothing: () => void;
  runnerWasInvoked: () => boolean;
  lastWrittenPath: () => unknown;
  lastWrittenContent: () => unknown;
  writtenContentFor: ({ pathIncludes }: { pathIncludes: string }) => unknown;
  readThrows: ({ error }: { error: Error }) => void;
  // The colocated harness file this run would read — real disk I/O a unit test has none of, so only
  // the two reads underneath it are staged. Everything above them (the gate, the load, `derive-cases`,
  // `follow-calls`) runs REAL, which is what lets a test prove `walked` reaching this overlay rather
  // than merely that the overlay was called.
  setupHarness: ({ source }: { source: string }) => void;
} => {
  cryptoSha256AdapterProxy();
  fsMkdirAdapterProxy();
  tsMorphWalkFileAdapterProxy();
  analyzeFileBrokerProxy();
  // The imported-type resolution runs REAL with its sibling resolve staged to "no sibling", so it is a
  // same-reference no-op for a target whose parameters name no resolvable reference.
  paramTypeResolveBrokerProxy();
  composeCrossFilePredicatesBrokerProxy();
  stubRealizeBrokerProxy();
  // The cross-file-map fold and its sibling-instrumentation run REAL; their sibling resolve is staged to
  // "no sibling", so both are same-reference no-ops for a target with no cross-file map reach.
  composeCrossFileMapBrokerProxy();
  // The harness overlay runs REAL. Its colocated-file read defaults to "nothing on disk", so it is a
  // same-reference no-op for every target here unless a test stages one via setupHarness below.
  const harness = harnessRealizeBrokerProxy();
  runCrossFileProbesBrokerProxy();
  // The overlay load is mocked wholesale to an EMPTY overlay: reading committed corrections off disk is
  // I/O a unit test does not stage, so stub-realize sees no correction and its object-arrange overlay is
  // a same-reference no-op. The child proxy satisfies structure; the direct registerMock is the intercept.
  stubOverlayLoadBrokerProxy();
  const overlayLoadHandle = registerMock({ fn: stubOverlayLoadBroker });
  overlayLoadHandle.calledWith([]).resolves([]);

  const runner = jestRunCliAdapterProxy();
  const exists = fsExistsAdapterProxy();
  const writes = fsWriteFileAdapterProxy();
  const reads = fsReadFileAdapterProxy();

  return {
    setupSavedRun: ({ run }: { run: unknown }): void => { reads.returns({ content: JSON.stringify(run) }); },
    // The runner ran and left no artifact — it crashed, which is the ONE case that is Assayer's fault
    // rather than a verdict about the file.
    runnerWroteNothing: (): void => { exists.fails(); },
    runnerWasInvoked: (): boolean => runner.lastConfig() !== undefined,
    lastWrittenPath: (): unknown => writes.getWrittenPath(),
    lastWrittenContent: (): unknown => writes.getWrittenContent(),
    writtenContentFor: ({ pathIncludes }: { pathIncludes: string }): unknown => writes.getWrittenContentFor({ pathIncludes }),
    // The read-back is deliberately unwrapped -- no try/catch -- so a filesystem rejection (ENOENT and
    // the like) propagates to the caller unmodified. This stages that rejection.
    readThrows: ({ error }: { error: Error }): void => { reads.throws({ error }); },
    setupHarness: ({ source }: { source: string }): void => { harness.setupHarness({ source }); },
  };
};
