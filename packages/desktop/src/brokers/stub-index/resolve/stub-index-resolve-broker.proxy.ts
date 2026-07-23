import { registerMock } from '@dungeonmaster/testing/register-mock';
import { stubOverlayLoadBroker } from '@assayer/core/brokers';
import { stubOverlayLoadBrokerProxy } from '@assayer/core/testing';
import type { AssayerCacheManifestStub, StubIndexStub, StubOverlayStub } from '@assayer/shared/contracts';

import { cacheLoadManifestBrokerProxy } from '../../cache/load-manifest/cache-load-manifest-broker.proxy';
import { cacheLoadStubIndexBrokerProxy } from '../../cache/load-stub-index/cache-load-stub-index-broker.proxy';
import { repoSourceRootBrokerProxy } from '../../repo/source-root/repo-source-root-broker.proxy';
import { nodeFsCacheManifestExistsAdapterProxy } from '../../../adapters/node-fs/cache-manifest-exists/node-fs-cache-manifest-exists-adapter.proxy';

export const stubIndexResolveBrokerProxy = (): {
  setup: (params: {
    manifest: ReturnType<typeof AssayerCacheManifestStub>;
    index: ReturnType<typeof StubIndexStub>;
  }) => void;
  setupNoIndex: (params: { manifest: ReturnType<typeof AssayerCacheManifestStub> }) => void;
  setupMissingManifest: () => void;
  withOverlays: (params: { overlays: readonly ReturnType<typeof StubOverlayStub>[] }) => void;
} => {
  const manifestProxy = cacheLoadManifestBrokerProxy();
  const existsProxy = nodeFsCacheManifestExistsAdapterProxy();
  const indexProxy = cacheLoadStubIndexBrokerProxy();
  // Bare-called: repoSourceRootBroker resolves a root through a config-load mock; its default is
  // enough for the combine, and the overlay read itself is mocked at the broker seam below.
  repoSourceRootBrokerProxy();
  // Bare-called for enforce-proxy-child-creation. The overlay read is controlled at the broker
  // boundary (the sanctioned cross-package seam) so the resolver's combine runs against a controlled
  // overlay rather than touching the real filesystem — the same pattern repoSourceRootBrokerProxy uses.
  stubOverlayLoadBrokerProxy();
  const overlayHandle = registerMock({ fn: stubOverlayLoadBroker });
  overlayHandle.mockResolvedValue([]);

  return {
    setup: ({ manifest, index }): void => {
      existsProxy.exists();
      manifestProxy.resolves({ manifest });
      indexProxy.resolves({ index });
    },
    setupNoIndex: ({ manifest }): void => {
      existsProxy.exists();
      manifestProxy.resolves({ manifest });
      indexProxy.absent();
    },
    setupMissingManifest: (): void => {
      existsProxy.missing();
    },
    withOverlays: ({ overlays }): void => {
      overlayHandle.mockResolvedValue([...overlays]);
    },
  };
};
