import {
  AssayerCacheManifestStub,
  CompiledFileBlobStub,
  FileAnalysisStub,
  RelPathStub,
  ResolvedEdgeStub,
  ResolvedIndexStub,
} from '@assayer/shared/contracts';

import { compiledFileResolveBroker } from './compiled-file-resolve-broker';
import { compiledFileResolveBrokerProxy } from './compiled-file-resolve-broker.proxy';
import { RepoPathStub } from '../../../contracts/repo-path/repo-path.stub';

describe('compiledFileResolveBroker', () => {
  describe('successful resolve', () => {
    it('VALID: {relPath present in current namespace} => resolves the compiled file view with no edges', async () => {
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

      const { displayLines, nodes, contentHash } = blob;

      expect(result).toStrictEqual({ relPath: 'src/index.ts', contentHash, displayLines, nodes, resolvedEdges: [] });
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

    it('VALID: {resolved index has edges from this file and others} => keeps only the edges whose from is this file', async () => {
      const manifest = AssayerCacheManifestStub({
        namespaces: { main: { files: [{ relPath: 'src/index.ts', contentHash: 'a'.repeat(64) }] } },
      });
      const ownEdge = ResolvedEdgeStub({
        from: 'src/index.ts',
        specifier: './greeting',
        importedName: 'greeting',
        target: { kind: 'local', relPath: 'src/greeting.ts' },
      });
      const otherEdge = ResolvedEdgeStub({ from: 'src/other.ts', specifier: './x', importedName: 'x' });
      const index = ResolvedIndexStub({ edges: [ownEdge, otherEdge] });

      const proxy = compiledFileResolveBrokerProxy();
      proxy.setupManifest({ manifest });
      proxy.setupBlob({ blob: CompiledFileBlobStub() });
      proxy.setupResolvedIndex({ index });

      const result = await compiledFileResolveBroker({
        repoPath: RepoPathStub({ value: '/repo' }),
        relPath: RelPathStub({ value: 'src/index.ts' }),
      });

      expect(result.resolvedEdges).toStrictEqual([ownEdge]);
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
