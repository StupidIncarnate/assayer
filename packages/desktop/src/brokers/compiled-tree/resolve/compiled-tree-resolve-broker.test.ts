import { compiledTreeResolveBroker } from './compiled-tree-resolve-broker';
import { compiledTreeResolveBrokerProxy } from './compiled-tree-resolve-broker.proxy';
import { AssayerCacheManifestStub } from '@assayer/shared/contracts';
import { RepoPathStub } from '../../../contracts/repo-path/repo-path.stub';

describe('compiledTreeResolveBroker', () => {
  it('VALID: {current namespace main with a.ts, b.tsx} => returns CompiledTree with counts and nodes', async () => {
    const proxy = compiledTreeResolveBrokerProxy();
    const manifest = AssayerCacheManifestStub({
      namespaces: {
        main: {
          files: [
            { relPath: 'a.ts', contentHash: 'a'.repeat(64) },
            { relPath: 'b.tsx', contentHash: 'b'.repeat(64) },
          ],
        },
      },
    });
    proxy.setupManifest({ manifest });

    const result = await compiledTreeResolveBroker({ repoPath: RepoPathStub({ value: '/repo' }) });

    expect(result).toStrictEqual({
      summary: { repoName: 'assayer', branchName: 'main', rootFolderName: 'smoke-repo', tsCount: 1, tsxCount: 1 },
      nodes: [
        { name: 'a.ts', path: 'a.ts', kind: 'file' },
        { name: 'b.tsx', path: 'b.tsx', kind: 'file' },
      ],
    });
  });

  it('EMPTY: {current namespace main with no files} => returns CompiledTree with zero counts and no nodes', async () => {
    const proxy = compiledTreeResolveBrokerProxy();
    const manifest = AssayerCacheManifestStub({ namespaces: { main: { files: [] } } });
    proxy.setupManifest({ manifest });

    const result = await compiledTreeResolveBroker({ repoPath: RepoPathStub({ value: '/repo' }) });

    expect(result).toStrictEqual({
      summary: { repoName: 'assayer', branchName: 'main', rootFolderName: 'smoke-repo', tsCount: 0, tsxCount: 0 },
      nodes: [],
    });
  });

  it('EMPTY: {no cache manifest on disk} => returns an empty CompiledTree with placeholder summary, zero counts, and no nodes', async () => {
    const proxy = compiledTreeResolveBrokerProxy();
    proxy.setupMissingManifest();

    const result = await compiledTreeResolveBroker({ repoPath: RepoPathStub({ value: '/repo' }) });

    expect(result).toStrictEqual({
      summary: { repoName: 'default', branchName: 'default', rootFolderName: 'default', tsCount: 0, tsxCount: 0 },
      nodes: [],
    });
  });

  it('ERROR: {manifest load rejects} => propagates the rejection', async () => {
    const proxy = compiledTreeResolveBrokerProxy();
    proxy.rejects({ error: new Error('cache manifest not found') });

    await expect(compiledTreeResolveBroker({ repoPath: RepoPathStub({ value: '/repo' }) })).rejects.toThrow(
      /cache manifest not found/u,
    );
  });
});
