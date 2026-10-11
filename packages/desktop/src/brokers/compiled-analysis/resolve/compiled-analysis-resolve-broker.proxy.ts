import { composeCrossFilePredicatesBrokerProxy } from '@assayer/core/brokers/compose/cross-file-predicates/compose-cross-file-predicates-broker.proxy';
import { composeCrossFileMapBrokerProxy } from '@assayer/core/brokers/compose/cross-file-map/compose-cross-file-map-broker.proxy';
import { fileWalkBrokerProxy } from '@assayer/core/brokers/file/walk/file-walk-broker.proxy';
import { harnessRealizeBrokerProxy } from '@assayer/core/brokers/harness/realize/harness-realize-broker.proxy';
import { paramTypeResolveBrokerProxy } from '@assayer/core/brokers/param-type/resolve/param-type-resolve-broker.proxy';
import { stubRealizeBrokerProxy } from '@assayer/core/brokers/stub/realize/stub-realize-broker.proxy';
import { stubOverlayLoadBrokerProxy } from '@assayer/core/brokers/stub-overlay/load/stub-overlay-load-broker.proxy';

import { repoSourceRootBrokerProxy } from '../../repo/source-root/repo-source-root-broker.proxy';
import { readFileIfExistsProxy } from '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';

export const compiledAnalysisResolveBrokerProxy = (): {
  sourceRootRepoRoot: (params: { repoPath: string; repoRoot: string }) => void;
  sourceReads: (params: { root: string; relPath: string; content: string }) => void;
  sourceMissing: (params: { root: string; relPath: string }) => void;
  siblingResolvesTo: (params: { fileName: string; source: string; specifier: string }) => void;
  harnessReads: (params: { path: string; source: string }) => void;
  harnessMissing: (params: { path: string }) => void;
} => {
  const sourceRootProxy = repoSourceRootBrokerProxy();
  const sourceReadProxy = readFileIfExistsProxy();

  // The overlays run for real. Each sibling file an overlay resolves and reads is staged through the
  // compose proxy, since every overlay resolves a sibling through the same seam. The stub overlay proxy
  // stages the committed-corrections folder and the harness proxy stages the colocated harness file.
  paramTypeResolveBrokerProxy();
  stubRealizeBrokerProxy();
  composeCrossFileMapBrokerProxy();
  const walkProxy = fileWalkBrokerProxy();
  const composeProxy = composeCrossFilePredicatesBrokerProxy();
  const overlayProxy = stubOverlayLoadBrokerProxy();
  const harnessProxy = harnessRealizeBrokerProxy();

  return {
    sourceRootRepoRoot: ({ repoPath, repoRoot }): void => {
      sourceRootProxy.configHasRepoRoot({ repoPath, repoRoot });
    },
    // The source file exists, no tsconfig owns it (so it walks, and its imports resolve, under
    // TypeScript's defaults), and no committed stub corrections sit under its root.
    sourceReads: ({ root, relPath, content }): void => {
      sourceReadProxy.returns({ path: `${root}/${relPath}`, contents: content });
      walkProxy.filesWithoutOwner({ absPaths: [`${root}/${relPath}`] });
      overlayProxy.dirMissing({ path: `${root}/assayer/stubs/objects` });
      overlayProxy.dirMissing({ path: `${root}/assayer/stubs/env` });
    },
    sourceMissing: ({ root, relPath }): void => {
      sourceReadProxy.missing({ path: `${root}/${relPath}` });
    },
    // A sibling file the served file imports: the import specifier lands on `fileName`, whose contents
    // are `source`.
    siblingResolvesTo: ({ fileName, source, specifier }): void => {
      composeProxy.setupSibling({ fileName, source, specifier });
    },
    // The colocated harness file at `path` exists and holds `source`.
    harnessReads: ({ path, source }): void => {
      harnessProxy.setupHarness({ path, source });
    },
    // No harness file sits beside the served file at `path`.
    harnessMissing: ({ path }): void => {
      harnessProxy.setupNoHarness({ path });
    },
  };
};
