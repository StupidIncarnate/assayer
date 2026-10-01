import { registerMock } from '@dungeonmaster/testing/register-mock';
import { HarnessIndexStub } from '@assayer/shared/contracts/harness-index/harness-index.stub';
import { ResolvedIndexStub } from '@assayer/shared/contracts/resolved-index/resolved-index.stub';
import { StubIndexStub } from '@assayer/shared/contracts/stub-index/stub-index.stub';
import { StubOverlayStub } from '@assayer/shared/contracts/stub-overlay/stub-overlay.stub';

import { PropertyGuardStub } from '../../../contracts/property-guard/property-guard.stub';

import { compileResolveRootBrokerProxy } from '../resolve-root/compile-resolve-root-broker.proxy';
import { gitCurrentBranchBrokerProxy } from '../../git/current-branch/git-current-branch-broker.proxy';
import { compilePlanCurrentBrokerProxy } from '../plan-current/compile-plan-current-broker.proxy';
import { processTargetsLayerBrokerProxy } from './process-targets-layer-broker.proxy';
import { stableNamespaceLayerBrokerProxy } from './stable-namespace-layer-broker.proxy';
import { manifestWriteBrokerProxy } from '../../manifest/write/manifest-write-broker.proxy';
import { compileResolveGraphBroker } from '../resolve-graph/compile-resolve-graph-broker';
import { compileResolveGraphBrokerProxy } from '../resolve-graph/compile-resolve-graph-broker.proxy';
import { compileStubGraphBroker } from '../stub-graph/compile-stub-graph-broker';
import { compileStubGraphBrokerProxy } from '../stub-graph/compile-stub-graph-broker.proxy';
import { compileHarnessGraphBroker } from '../harness-graph/compile-harness-graph-broker';
import { compileHarnessGraphBrokerProxy } from '../harness-graph/compile-harness-graph-broker.proxy';
import { stubOverlayLoadBroker } from '../../stub-overlay/load/stub-overlay-load-broker';
import { stubOverlayLoadBrokerProxy } from '../../stub-overlay/load/stub-overlay-load-broker.proxy';
import { stubOverlayReconcileBrokerProxy } from '../../stub-overlay/reconcile/stub-overlay-reconcile-broker.proxy';
import { resolvedIndexWriteBroker } from '../../resolved-index/write/resolved-index-write-broker';
import { resolvedIndexWriteBrokerProxy } from '../../resolved-index/write/resolved-index-write-broker.proxy';

export const compileRunBrokerProxy = (): {
  onCurrentBranch: (params: { name: string }) => void;
  // `configDir` is the directory the caller hands the broker. The stub config's repoRoot is '.', so the
  // walk root is `configDir` too, and the blob store is `<configDir>/.assayer/cache/blobs`.
  queueCurrentFiles: (params: { configDir: string; contents: readonly string[] }) => void;
  stableUnchanged: (params: { ref: string; sha: string }) => void;
  stableChanged: (params: {
    configDir: string;
    ref: string;
    sha: string;
    lsTreeStdout: string;
    blobs: readonly { blobSha: string; content: string }[];
  }) => void;
  stableChangedCommitUnresolvable: (params: {
    configDir: string;
    ref: string;
    lsTreeStdout: string;
    blobs: readonly { blobSha: string; content: string }[];
  }) => void;
  // Stages every write a clean run makes under `configDir`: the manifest, and the three derived indexes.
  manifestWriteSucceeds: (params: { configDir: string }) => void;
  // The stitch reports this error for every walk root `queueCurrentFiles` staged, under every namespace.
  resolvesWithError: (params: { relPath: string; line: number; column: number; message: string }) => void;
  overlayStale: (params: { configDir: string }) => void;
  overlayContradicts: (params: { configDir: string }) => void;
  harnessInvalid: (params: { configDir: string; relPath: string; message: string }) => void;
  // Takes the same configDir the caller hands the broker; the manifest path derives from it.
  getWrittenManifest: ({ configDir }: { configDir: string }) => unknown;
  wasManifestWritten: (params: { configDir: string }) => boolean;
  getProcessedFileCount: () => number;
  getResolvedIndexWriteOrder: () => readonly string[];
  getPropertyIndexWriteOrder: () => readonly string[];
  getHarnessGraphWriteOrder: () => readonly string[];
} => {
  compileResolveRootBrokerProxy();
  const currentBranchProxy = gitCurrentBranchBrokerProxy();
  const planCurrentProxy = compilePlanCurrentBrokerProxy();
  const processCurrentProxy = processTargetsLayerBrokerProxy();
  const stableProxy = stableNamespaceLayerBrokerProxy();
  const manifestProxy = manifestWriteBrokerProxy();

  // The three stitches and the resolved-index write stay replaced. Each stitch reads back the blobs
  // this run's own processing wrote, and those bytes are the analyzer's real output, which no proxy
  // method can stage. Each stitch's own tests cover it. Every one is staged by an argument the broker
  // really passes: the walk root, or the config directory.
  compileResolveGraphBrokerProxy();
  resolvedIndexWriteBrokerProxy();
  compileStubGraphBrokerProxy();
  compileHarnessGraphBrokerProxy();
  const resolveHandle = registerMock({ fn: compileResolveGraphBroker });
  const resolvedWriteHandle = registerMock({ fn: resolvedIndexWriteBroker });
  const stubGraphHandle = registerMock({ fn: compileStubGraphBroker });
  const harnessGraphHandle = registerMock({ fn: compileHarnessGraphBroker });
  // Every walk root `queueCurrentFiles` staged, so a later resolver error is staged for the same roots.
  const walkRoots: string[] = [];

  // The overlay LOAD stays replaced (its own tests cover reading `assayer/stubs/`), staged by the repo
  // root it reads under. The overlay RECONCILE runs REAL against the staged current stub index, so a
  // staged stale overlay drives its own P1 error through the errors[] gate.
  stubOverlayLoadBrokerProxy();
  stubOverlayReconcileBrokerProxy();
  const overlayLoadHandle = registerMock({ fn: stubOverlayLoadBroker });

  // Captures the NAMESPACE each call reached, in call order -- the only way to pin the "write STABLE
  // before CURRENT" collision-handling invariant the broker's own comments claim, since these three
  // callees are replaced wholesale and their real implementations (covered by their own tests) never
  // run here to produce an observable side effect.
  const resolvedIndexWriteOrder: string[] = [];
  const stubGraphIndex = StubIndexStub();
  const stubGraphWriteOrder: string[] = [];
  const harnessGraphIndex = HarnessIndexStub({ harnesses: [] });
  const harnessGraphWriteOrder: string[] = [];

  return {
    onCurrentBranch: ({ name }: { name: string }): void => {
      currentBranchProxy.onBranch({ name });
    },
    queueCurrentFiles: ({ configDir, contents }: { configDir: string; contents: readonly string[] }): void => {
      const blobsDir = `${configDir}/.assayer/cache/blobs`;
      planCurrentProxy.queueDir({
        path: configDir,
        entries: contents.map((_content, index) => ({ name: `current-${index}.ts`, kind: 'file' as const })),
      });
      contents.forEach((content, index) => {
        planCurrentProxy.queueFileContent({ path: `${configDir}/current-${index}.ts`, content });
        processCurrentProxy.queueCleanWrite({ blobsDir, content });
      });
      // The stitch resolves every import cleanly, and no stub overlay is committed under the root.
      walkRoots.push(configDir);
      resolveHandle.calledWith([{ root: configDir }]).resolves({ index: ResolvedIndexStub(), errors: [] });
      overlayLoadHandle.calledWith([{ repoRoot: configDir }]).resolves([]);
    },
    stableUnchanged: ({ ref, sha }: { ref: string; sha: string }): void => {
      stableProxy.unchanged({ ref, sha });
    },
    stableChanged: ({
      configDir,
      ref,
      sha,
      lsTreeStdout,
      blobs,
    }: {
      configDir: string;
      ref: string;
      sha: string;
      lsTreeStdout: string;
      blobs: readonly { blobSha: string; content: string }[];
    }): void => {
      stableProxy.changed({
        ref,
        sha,
        lsTreeStdout,
        blobs,
        blobsDir: `${configDir}/.assayer/cache/blobs`,
      });
    },
    stableChangedCommitUnresolvable: ({
      configDir,
      ref,
      lsTreeStdout,
      blobs,
    }: {
      configDir: string;
      ref: string;
      lsTreeStdout: string;
      blobs: readonly { blobSha: string; content: string }[];
    }): void => {
      stableProxy.changedCommitUnresolvable({
        ref,
        lsTreeStdout,
        blobs,
        blobsDir: `${configDir}/.assayer/cache/blobs`,
      });
    },
    manifestWriteSucceeds: ({ configDir }: { configDir: string }): void => {
      manifestProxy.succeeds({ configDir });
      // Each write records the namespace it reached, in call order, so a test can read back the
      // "write STABLE before CURRENT" order the broker's own comments claim.
      resolvedWriteHandle.calledWith([{ configDir }]).implement(({ namespace }: { namespace: string }) => {
        resolvedIndexWriteOrder.push(namespace);
        return { success: true };
      });
      stubGraphHandle.calledWith([{ configDir }]).implement(({ namespace }: { namespace: string }) => {
        stubGraphWriteOrder.push(namespace);
        return { index: stubGraphIndex, guards: [] };
      });
      harnessGraphHandle.calledWith([{ configDir }]).implement(({ namespace }: { namespace: string }) => {
        harnessGraphWriteOrder.push(namespace);
        return { index: harnessGraphIndex, errors: [] };
      });
    },
    resolvesWithError: ({
      relPath,
      line,
      column,
      message,
    }: {
      relPath: string;
      line: number;
      column: number;
      message: string;
    }): void => {
      walkRoots.forEach((root) => {
        resolveHandle
          .calledWith([{ root }])
          .resolves({ index: ResolvedIndexStub(), errors: [{ relPath, line, column, message }] });
      });
    },
    // The walk root is `configDir` in these scenarios, so the overlay load reads under it.
    overlayStale: ({ configDir }: { configDir: string }): void => {
      overlayLoadHandle.calledWith([{ repoRoot: configDir }]).resolves([
        StubOverlayStub({ key: 'src/gone.ts#Gone', overlayPath: 'assayer/stubs/objects/src/gone.ts/Gone.json' }),
      ]);
    },
    // A committed correction that RESOLVES (its type + property are in the derived index, so reconcile is
    // silent) but whose authoritative values (`dev`, `prod`, `staging`) can never satisfy the `mode === 'a'`
    // guard the stub stitch gathered — a pre-run contradiction on the same errors[] channel.
    overlayContradicts: ({ configDir }: { configDir: string }): void => {
      stubGraphHandle.calledWith([{ configDir }]).resolves({ index: StubIndexStub(), guards: [PropertyGuardStub()] });
      overlayLoadHandle.calledWith([{ repoRoot: configDir }]).resolves([StubOverlayStub()]);
    },
    // A committed harness whose declaration the stitch rejected — the third producer on the same
    // errors[] channel as a broken import and a stale overlay.
    harnessInvalid: ({ configDir, relPath, message }: { configDir: string; relPath: string; message: string }): void => {
      harnessGraphHandle.calledWith([{ configDir }]).resolves({
        index: HarnessIndexStub({ harnesses: [] }),
        errors: [{ relPath, line: 1, column: 1, message }],
      });
    },
    getWrittenManifest: ({ configDir }: { configDir: string }): unknown =>
      manifestProxy.getWrittenManifest({ configDir }),
    wasManifestWritten: ({ configDir }: { configDir: string }): boolean =>
      manifestProxy.wasWritten({ configDir }),
    getProcessedFileCount: (): number => processCurrentProxy.processedCount(),
    getResolvedIndexWriteOrder: (): readonly string[] => resolvedIndexWriteOrder,
    getPropertyIndexWriteOrder: (): readonly string[] => stubGraphWriteOrder,
    getHarnessGraphWriteOrder: (): readonly string[] => harnessGraphWriteOrder,
  };
};
