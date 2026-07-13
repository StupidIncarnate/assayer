import { AssayerCacheManifestStub, CompiledFileBlobStub, FileAnalysisStub, RelPathStub } from '@assayer/shared/contracts';

import { compiledFileResolveBroker } from './compiled-file-resolve-broker';
import { compiledFileResolveBrokerProxy } from './compiled-file-resolve-broker.proxy';
import { RepoPathStub } from '../../../contracts/repo-path/repo-path.stub';

describe('compiledFileResolveBroker', () => {
  describe('successful resolve', () => {
    it('VALID: {relPath present in current namespace} => resolves the compiled file view', async () => {
      const manifest = AssayerCacheManifestStub({
        namespaces: {
          main: {
            files: [{ relPath: 'src/index.ts', contentHash: 'a'.repeat(64) }],
          },
        },
      });
      const blob = CompiledFileBlobStub();

      const proxy = compiledFileResolveBrokerProxy();
      proxy.setupManifest({ manifest });
      proxy.setupBlob({ blob });

      const result = await compiledFileResolveBroker({
        repoPath: RepoPathStub({ value: '/repo' }),
        relPath: RelPathStub({ value: 'src/index.ts' }),
      });

      const { lines, nodes, contentHash } = blob;

      expect(result).toStrictEqual({ relPath: 'src/index.ts', contentHash, lines, nodes });
    });

    it('VALID: {blob carries analysis} => resolves the view including the analysis', async () => {
      const manifest = AssayerCacheManifestStub({
        namespaces: { main: { files: [{ relPath: 'src/index.ts', contentHash: 'a'.repeat(64) }] } },
      });
      const analysis = FileAnalysisStub();
      const blob = CompiledFileBlobStub({ analysis });

      const proxy = compiledFileResolveBrokerProxy();
      proxy.setupManifest({ manifest });
      proxy.setupBlob({ blob });

      const result = await compiledFileResolveBroker({
        repoPath: RepoPathStub({ value: '/repo' }),
        relPath: RelPathStub({ value: 'src/index.ts' }),
      });

      expect(result.analysis).toStrictEqual(analysis);
    });
  });

  describe('error cases', () => {
    it('ERROR: {relPath not present in current namespace} => throws naming the requested relPath', async () => {
      const manifest = AssayerCacheManifestStub({
        namespaces: {
          main: {
            files: [{ relPath: 'other.ts', contentHash: 'a'.repeat(64) }],
          },
        },
      });

      const proxy = compiledFileResolveBrokerProxy();
      proxy.setupManifest({ manifest });

      await expect(
        compiledFileResolveBroker({
          repoPath: RepoPathStub({ value: '/repo' }),
          relPath: RelPathStub({ value: 'missing.ts' }),
        }),
      ).rejects.toThrow(/missing\.ts/u);
    });
  });
});
