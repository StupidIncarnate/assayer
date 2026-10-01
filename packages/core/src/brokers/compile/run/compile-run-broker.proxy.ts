import { registerMock } from '@dungeonmaster/testing/register-mock';
import {
  HarnessIndexStub,
  ResolvedIndexStub,
  StubIndexStub,
  StubOverlayStub,
  namespaceNameContract,
} from '@assayer/shared/contracts';
import type { FileCount, NamespaceName } from '@assayer/shared/contracts';

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
  manifestWriteSucceeds: (params: { configDir: string }) => void;
  resolvesWithError: (params: { relPath: string; line: number; column: number; message: string }) => void;
  overlayStale: () => void;
  overlayContradicts: () => void;
  harnessInvalid: (params: { relPath: string; message: string }) => void;
  // Takes the same configDir the caller hands the broker; the manifest path derives from it.
  getWrittenManifest: ({ configDir }: { configDir: string }) => unknown;
  wasManifestWritten: (params: { configDir: string }) => boolean;
  getProcessedFileCount: () => FileCount;
  getResolvedIndexWriteOrder: () => readonly NamespaceName[];
  getPropertyIndexWriteOrder: () => readonly NamespaceName[];
  getHarnessGraphWriteOrder: () => readonly NamespaceName[];
} => {
  compileResolveRootBrokerProxy();
  const currentBranchProxy = gitCurrentBranchBrokerProxy();
  const planCurrentProxy = compilePlanCurrentBrokerProxy();
  const processCurrentProxy = processTargetsLayerBrokerProxy();
  const stableProxy = stableNamespaceLayerBrokerProxy();
  const manifestProxy = manifestWriteBrokerProxy();

  // The stitch and its index write are REPLACED wholesale: this broker's own tests drive planning,
  // processing, and the manifest; the resolver reads blobs back from disk (its own tests cover that),
  // so here it returns a clean resolution unless a test asks for a build error.
  compileResolveGraphBrokerProxy();
  resolvedIndexWriteBrokerProxy();
  compileStubGraphBrokerProxy();
  compileHarnessGraphBrokerProxy();
  const resolveHandle = registerMock({ fn: compileResolveGraphBroker });
  const resolvedWriteHandle = registerMock({ fn: resolvedIndexWriteBroker });
  const stubGraphHandle = registerMock({ fn: compileStubGraphBroker });
  const harnessGraphHandle = registerMock({ fn: compileHarnessGraphBroker });
  resolveHandle.calledWith([]).resolves({ index: ResolvedIndexStub(), errors: [] });

  // The overlay LOAD is replaced wholesale (its own tests cover reading `assayer/stubs/`); it defaults
  // to no committed overlay. The overlay RECONCILE runs REAL against the mocked current stub index, so
  // a staged stale overlay drives its own P1 error through the errors[] gate.
  stubOverlayLoadBrokerProxy();
  stubOverlayReconcileBrokerProxy();
  const overlayLoadHandle = registerMock({ fn: stubOverlayLoadBroker });
  overlayLoadHandle.calledWith([]).resolves([]);

  // Captures the NAMESPACE each call reached, in call order -- the only way to pin the "write STABLE
  // before CURRENT" collision-handling invariant the broker's own comments claim, since these three
  // callees are replaced wholesale and their real implementations (covered by their own tests) never
  // run here to produce an observable side effect.
  const resolvedIndexWriteOrder: NamespaceName[] = [];
  resolvedWriteHandle.calledWith([]).implement(({ namespace }: { namespace: string }) => {
    resolvedIndexWriteOrder.push(namespaceNameContract.parse(namespace));
    return { success: true };
  });

  const stubGraphIndex = StubIndexStub();
  const stubGraphWriteOrder: NamespaceName[] = [];
  stubGraphHandle.calledWith([]).implement(({ namespace }: { namespace: string }) => {
    stubGraphWriteOrder.push(namespaceNameContract.parse(namespace));
    return { index: stubGraphIndex, guards: [] };
  });

  const harnessGraphIndex = HarnessIndexStub({ harnesses: [] });
  const harnessGraphWriteOrder: NamespaceName[] = [];
  harnessGraphHandle.calledWith([]).implement(({ namespace }: { namespace: string }) => {
    harnessGraphWriteOrder.push(namespaceNameContract.parse(namespace));
    return { index: harnessGraphIndex, errors: [] };
  });

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
      resolveHandle.calledWith([]).resolves({ index: ResolvedIndexStub(), errors: [{ relPath, line, column, message }] });
    },
    overlayStale: (): void => {
      overlayLoadHandle.calledWith([]).resolves([
        StubOverlayStub({ key: 'src/gone.ts#Gone', overlayPath: 'assayer/stubs/objects/src/gone.ts/Gone.json' }),
      ]);
    },
    // A committed correction that RESOLVES (its type + property are in the derived index, so reconcile is
    // silent) but whose authoritative values (`dev`, `prod`, `staging`) can never satisfy the `mode === 'a'`
    // guard the stub stitch gathered — a pre-run contradiction on the same errors[] channel.
    overlayContradicts: (): void => {
      stubGraphHandle.calledWith([]).resolves({ index: StubIndexStub(), guards: [PropertyGuardStub()] });
      overlayLoadHandle.calledWith([]).resolves([StubOverlayStub()]);
    },
    // A committed harness whose declaration the stitch rejected — the third producer on the same
    // errors[] channel as a broken import and a stale overlay.
    harnessInvalid: ({ relPath, message }: { relPath: string; message: string }): void => {
      harnessGraphHandle.calledWith([]).resolves({
        index: HarnessIndexStub({ harnesses: [] }),
        errors: [{ relPath, line: 1, column: 1, message }],
      });
    },
    getWrittenManifest: ({ configDir }: { configDir: string }): unknown =>
      manifestProxy.getWrittenManifest({ configDir }),
    wasManifestWritten: ({ configDir }: { configDir: string }): boolean =>
      manifestProxy.wasWritten({ configDir }),
    getProcessedFileCount: (): FileCount => processCurrentProxy.processedCount(),
    getResolvedIndexWriteOrder: (): readonly NamespaceName[] => resolvedIndexWriteOrder,
    getPropertyIndexWriteOrder: (): readonly NamespaceName[] => stubGraphWriteOrder,
    getHarnessGraphWriteOrder: (): readonly NamespaceName[] => harnessGraphWriteOrder,
  };
};
