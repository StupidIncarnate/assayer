import type { StubArgument } from '@dungeonmaster/shared/@types';

import { assayerCacheManifestContract } from './assayer-cache-manifest-contract';
import type { AssayerCacheManifest } from './assayer-cache-manifest-contract';

export const AssayerCacheManifestStub = ({
  ...props
}: StubArgument<AssayerCacheManifest> = {}): AssayerCacheManifest =>
  assayerCacheManifestContract.parse({
    assayerVersion: '1.0.0',
    configHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    namespaces: {
      master: {
        branch: 'master',
        commit: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
        files: [
          {
            relPath: 'packages/shared/src/index.ts',
            contentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          },
        ],
      },
    },
    repoName: 'assayer',
    rootFolderName: 'smoke-repo',
    ...props,
  });
