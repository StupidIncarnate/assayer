import { registerMock } from '@dungeonmaster/testing/register-mock';
import { ResolvedIndexStub, StubIndexStub, StubOverlayStub } from '@assayer/shared/contracts';
import type { FileCount } from '@assayer/shared/contracts';

import { PropertyGuardStub } from '../../../contracts/property-guard/property-guard.stub';

import { compileResolveRootBrokerProxy } from '../resolve-root/compile-resolve-root-broker.proxy';
import { pathBasenameAdapterProxy } from '../../../adapters/path/basename/path-basename-adapter.proxy';
import { gitCurrentBranchBrokerProxy } from '../../git/current-branch/git-current-branch-broker.proxy';
import { compilePlanCurrentBrokerProxy } from '../plan-current/compile-plan-current-broker.proxy';
import { processTargetsLayerBrokerProxy } from './process-targets-layer-broker.proxy';
import { stableNamespaceLayerBrokerProxy } from './stable-namespace-layer-broker.proxy';
import { manifestWriteBrokerProxy } from '../../manifest/write/manifest-write-broker.proxy';
import { compileResolveGraphBroker } from '../resolve-graph/compile-resolve-graph-broker';
import { compileResolveGraphBrokerProxy } from '../resolve-graph/compile-resolve-graph-broker.proxy';
import { compileStubGraphBroker } from '../stub-graph/compile-stub-graph-broker';
import { compileStubGraphBrokerProxy } from '../stub-graph/compile-stub-graph-broker.proxy';
import { stubOverlayLoadBroker } from '../../stub-overlay/load/stub-overlay-load-broker';
import { stubOverlayLoadBrokerProxy } from '../../stub-overlay/load/stub-overlay-load-broker.proxy';
import { stubOverlayReconcileBrokerProxy } from '../../stub-overlay/reconcile/stub-overlay-reconcile-broker.proxy';
import { resolvedIndexWriteBroker } from '../../resolved-index/write/resolved-index-write-broker';
import { resolvedIndexWriteBrokerProxy } from '../../resolved-index/write/resolved-index-write-broker.proxy';

export const compileRunBrokerProxy = (): {
  onCurrentBranch: (params: { name: string }) => void;
  queueCurrentFiles: (params: { contents: readonly string[] }) => void;
  stableUnchanged: (params: { sha: string }) => void;
  stableChanged: (params: { sha: string; lsTreeStdout: string; fileContents: readonly string[] }) => void;
  stableChangedCommitUnresolvable: (params: { lsTreeStdout: string; fileContents: readonly string[] }) => void;
  manifestWriteSucceeds: () => void;
  resolvesWithError: (params: { relPath: string; line: number; column: number; message: string }) => void;
  overlayStale: () => void;
  overlayContradicts: () => void;
  getWrittenManifest: () => unknown;
  wasManifestWritten: () => boolean;
  getProcessedFileCount: () => FileCount;
} => {
  compileResolveRootBrokerProxy();
  pathBasenameAdapterProxy();
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
  const resolveHandle = registerMock({ fn: compileResolveGraphBroker });
  const resolvedWriteHandle = registerMock({ fn: resolvedIndexWriteBroker });
  const stubGraphHandle = registerMock({ fn: compileStubGraphBroker });
  resolveHandle.mockResolvedValue({ index: ResolvedIndexStub(), errors: [] });
  resolvedWriteHandle.mockResolvedValue({ success: true });
  stubGraphHandle.mockResolvedValue({ index: StubIndexStub(), guards: [] });

  // The overlay LOAD is replaced wholesale (its own tests cover reading `assayer/stubs/`); it defaults
  // to no committed overlay. The overlay RECONCILE runs REAL against the mocked current stub index, so
  // a staged stale overlay drives its own P1 error through the errors[] gate.
  stubOverlayLoadBrokerProxy();
  stubOverlayReconcileBrokerProxy();
  const overlayLoadHandle = registerMock({ fn: stubOverlayLoadBroker });
  overlayLoadHandle.mockResolvedValue([]);

  return {
    onCurrentBranch: ({ name }: { name: string }): void => {
      currentBranchProxy.onBranch({ name });
    },
    queueCurrentFiles: ({ contents }: { contents: readonly string[] }): void => {
      planCurrentProxy.queueDir({
        entries: contents.map((_content, index) => ({ name: `current-${index}.ts`, isDirectory: false })),
      });
      contents.forEach((content) => {
        planCurrentProxy.queueFileContent({ content });
        processCurrentProxy.queueCleanWrite();
      });
    },
    stableUnchanged: ({ sha }: { sha: string }): void => {
      stableProxy.unchanged({ sha });
    },
    stableChanged: ({
      sha,
      lsTreeStdout,
      fileContents,
    }: {
      sha: string;
      lsTreeStdout: string;
      fileContents: readonly string[];
    }): void => {
      stableProxy.changed({ sha, lsTreeStdout, fileContents });
    },
    stableChangedCommitUnresolvable: ({
      lsTreeStdout,
      fileContents,
    }: {
      lsTreeStdout: string;
      fileContents: readonly string[];
    }): void => {
      stableProxy.changedCommitUnresolvable({ lsTreeStdout, fileContents });
    },
    manifestWriteSucceeds: (): void => {
      manifestProxy.succeeds();
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
      resolveHandle.mockResolvedValue({ index: ResolvedIndexStub(), errors: [{ relPath, line, column, message }] });
    },
    overlayStale: (): void => {
      overlayLoadHandle.mockResolvedValue([
        StubOverlayStub({ key: 'src/gone.ts#Gone', overlayPath: 'assayer/stubs/objects/src/gone.ts/Gone.json' }),
      ]);
    },
    // A committed correction that RESOLVES (its type + property are in the derived index, so reconcile is
    // silent) but whose authoritative values (`dev`, `prod`, `staging`) can never satisfy the `mode === 'a'`
    // guard the stub stitch gathered — a pre-run contradiction on the same errors[] channel.
    overlayContradicts: (): void => {
      stubGraphHandle.mockResolvedValue({ index: StubIndexStub(), guards: [PropertyGuardStub()] });
      overlayLoadHandle.mockResolvedValue([StubOverlayStub()]);
    },
    getWrittenManifest: (): unknown => manifestProxy.getWrittenManifest(),
    wasManifestWritten: (): boolean => manifestProxy.wasWritten(),
    getProcessedFileCount: (): FileCount => processCurrentProxy.processedCount(),
  };
};
