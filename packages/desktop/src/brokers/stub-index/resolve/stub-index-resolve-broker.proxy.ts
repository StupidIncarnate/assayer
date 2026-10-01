import { stubOverlayLoadBrokerProxy } from '@assayer/core/brokers/stub-overlay/load/stub-overlay-load-broker.proxy';
import type { AssayerCacheManifestStub } from '@assayer/shared/contracts/assayer-cache-manifest/assayer-cache-manifest.stub';
import type { StubIndexStub } from '@assayer/shared/contracts/stub-index/stub-index.stub';

import { cacheLoadManifestBrokerProxy } from '../../cache/load-manifest/cache-load-manifest-broker.proxy';
import { cacheLoadStubIndexBrokerProxy } from '../../cache/load-stub-index/cache-load-stub-index-broker.proxy';
import { repoSourceRootBrokerProxy } from '../../repo/source-root/repo-source-root-broker.proxy';
import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';

export const stubIndexResolveBrokerProxy = (): {
  setup: (params: {
    repoPath: string;
    namespace: string;
    manifest: ReturnType<typeof AssayerCacheManifestStub>;
    index: ReturnType<typeof StubIndexStub>;
  }) => void;
  setupNoIndex: (params: {
    repoPath: string;
    namespace: string;
    manifest: ReturnType<typeof AssayerCacheManifestStub>;
  }) => void;
  setupMissingManifest: (params: { repoPath: string }) => void;
  withObjectOverlay: (params: {
    repoPath: string;
    definitionRelPath: string;
    typeName: string;
    properties: Record<string, readonly string[]>;
  }) => void;
} => {
  const manifestProxy = cacheLoadManifestBrokerProxy();
  const existsProxy = pathExistsProxy();
  const indexProxy = cacheLoadStubIndexBrokerProxy();
  const sourceRootProxy = repoSourceRootBrokerProxy();
  const overlayProxy = stubOverlayLoadBrokerProxy();

  return {
    // The config sets no repoRoot of its own, so the source root is the repo path, and no committed
    // overlay directory exists under it.
    setup: ({ repoPath, namespace, manifest, index }): void => {
      existsProxy.present({ path: `${repoPath}/.assayer/cache/manifest.json` });
      manifestProxy.resolves({ repoPath, manifest });
      indexProxy.resolves({ repoPath, namespace, index });
      sourceRootProxy.configHasRepoRoot({ repoPath, repoRoot: '.' });
      overlayProxy.dirMissing({ path: `${repoPath}/assayer/stubs/objects` });
      overlayProxy.dirMissing({ path: `${repoPath}/assayer/stubs/env` });
    },
    setupNoIndex: ({ repoPath, namespace, manifest }): void => {
      existsProxy.present({ path: `${repoPath}/.assayer/cache/manifest.json` });
      manifestProxy.resolves({ repoPath, manifest });
      indexProxy.absent({ repoPath, namespace });
    },
    setupMissingManifest: ({ repoPath }): void => {
      existsProxy.missing({ path: `${repoPath}/.assayer/cache/manifest.json` });
    },
    // Stages one committed object correction at
    // `assayer/stubs/objects/<definitionRelPath>/<typeName>.json`, directory by directory.
    withObjectOverlay: ({ repoPath, definitionRelPath, typeName, properties }): void => {
      const objectsRoot = `${repoPath}/assayer/stubs/objects`;
      const fileName = `${typeName}.json`;
      const parts = [...definitionRelPath.split('/'), fileName];

      overlayProxy.dirExists({ path: objectsRoot });
      parts.forEach((name, depth) => {
        overlayProxy.queueDir({
          path: [objectsRoot, ...parts.slice(0, depth)].join('/'),
          entries: [{ name, kind: name === fileName ? 'file' : 'directory' }],
        });
      });
      overlayProxy.queueFileContent({
        path: [objectsRoot, ...parts].join('/'),
        content: JSON.stringify({
          type: `${definitionRelPath}#${typeName}`,
          properties: Object.fromEntries(
            Object.entries(properties).map(([name, values]) => [name, { values }]),
          ),
        }),
      });
    },
  };
};
