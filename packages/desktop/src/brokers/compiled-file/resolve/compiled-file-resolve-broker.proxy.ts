import { registerMock } from '@dungeonmaster/testing/register-mock';
import { composeCrossFilePredicatesBroker, stubRealizeBroker, stubOverlayLoadBroker } from '@assayer/core/brokers';
import {
  composeCrossFilePredicatesBrokerProxy,
  stubRealizeBrokerProxy,
  stubOverlayLoadBrokerProxy,
  tsMorphWalkFileAdapterProxy,
} from '@assayer/core/testing';

import { cacheLoadManifestBrokerProxy } from '../../cache/load-manifest/cache-load-manifest-broker.proxy';
import { cacheLoadBlobBrokerProxy } from '../../cache/load-blob/cache-load-blob-broker.proxy';
import { cacheLoadResolvedIndexBrokerProxy } from '../../cache/load-resolved-index/cache-load-resolved-index-broker.proxy';
import { repoSourceRootBrokerProxy } from '../../repo/source-root/repo-source-root-broker.proxy';
import { nodeFsReadSourceAdapterProxy } from '../../../adapters/node-fs/read-source/node-fs-read-source-adapter.proxy';
import type { AssayerCacheManifestStub, CompiledFileBlobStub, FileAnalysisStub, ResolvedIndexStub } from '@assayer/shared/contracts';

export const compiledFileResolveBrokerProxy = (): {
  setupManifest: (params: { manifest: ReturnType<typeof AssayerCacheManifestStub> }) => void;
  setupBlob: (params: { blob: ReturnType<typeof CompiledFileBlobStub> }) => void;
  setupResolvedIndex: (params: { index: ReturnType<typeof ResolvedIndexStub> }) => void;
  sourceRootRepoRoot: (params: { repoRoot: string }) => void;
  sourceReads: (params: { content: string }) => void;
  sourceMissing: () => void;
  composesTo: (params: { analysis: ReturnType<typeof FileAnalysisStub> }) => void;
  composeReceived: () => unknown;
} => {
  const manifestProxy = cacheLoadManifestBrokerProxy();
  const blobProxy = cacheLoadBlobBrokerProxy();
  // Base behaviour is "no resolved index for the namespace", so a view carries no edges unless a
  // test wires one via setupResolvedIndex.
  const resolvedIndexProxy = cacheLoadResolvedIndexBrokerProxy();
  // The source root resolves (config mocked) and the caller source reads by default, so a test that
  // only cares about the cache never wires them.
  const sourceRootProxy = repoSourceRootBrokerProxy();
  const sourceReadProxy = nodeFsReadSourceAdapterProxy();
  // The overlay is mocked at the seam it crosses: composing an imported predicate reaches for the
  // sibling file + tsconfig on disk, I/O a unit test cannot stage from another package. This mirrors
  // repoSourceRootBroker's proxy mocking configLoadBroker — the child proxy satisfies structure, the
  // direct registerMock is the intercept. The walk runs real (empty proxy); its result feeds the
  // mocked compose and is otherwise inert.
  composeCrossFilePredicatesBrokerProxy();
  tsMorphWalkFileAdapterProxy();
  const composeHandle = registerMock({ fn: composeCrossFilePredicatesBroker });
  // Default: a same-reference pass-through, so a file with no imported-predicate guard serves its
  // persisted analysis untouched.
  composeHandle.mockImplementation(({ analysis }) => analysis);
  // The object-arrange overlay is mocked at the same seam for the same reason: driving an object-member
  // branch reaches for the type definition + the committed overlay on disk. Its child proxy satisfies
  // structure; the direct registerMock is the intercept, a same-reference pass-through by default.
  stubRealizeBrokerProxy();
  stubOverlayLoadBrokerProxy();
  const stubRealizeHandle = registerMock({ fn: stubRealizeBroker });
  stubRealizeHandle.mockImplementation(({ analysis }) => analysis);
  const overlayLoadHandle = registerMock({ fn: stubOverlayLoadBroker });
  overlayLoadHandle.mockResolvedValue([]);

  // The { root, relPath } the broker hands the overlay, captured off the real call so a test can
  // prove the SOURCE root (not the config dir) is threaded.
  const composeCalls: unknown[] = [];

  return {
    setupManifest: ({ manifest }): void => {
      manifestProxy.resolves({ manifest });
    },
    setupBlob: ({ blob }): void => {
      blobProxy.resolves({ blob });
    },
    setupResolvedIndex: ({ index }): void => {
      resolvedIndexProxy.resolves({ index });
    },
    sourceRootRepoRoot: ({ repoRoot }): void => {
      sourceRootProxy.configHasRepoRoot({ repoRoot });
    },
    sourceReads: ({ content }): void => {
      sourceReadProxy.returns({ content });
    },
    sourceMissing: (): void => {
      sourceReadProxy.missing();
    },
    composesTo: ({ analysis }): void => {
      composeHandle.mockImplementationOnce(({ root, relPath }) => {
        composeCalls.push({ root, relPath });

        return analysis;
      });
    },
    composeReceived: (): unknown => composeCalls.at(-1),
  };
};
