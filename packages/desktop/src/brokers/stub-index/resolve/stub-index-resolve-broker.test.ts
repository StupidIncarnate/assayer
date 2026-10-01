import { AssayerCacheManifestStub } from '@assayer/shared/contracts/assayer-cache-manifest/assayer-cache-manifest.stub';
import { StubIndexStub } from '@assayer/shared/contracts/stub-index/stub-index.stub';
import { ObjectStubStub } from '@assayer/shared/contracts/object-stub/object-stub.stub';

import { stubIndexResolveBroker } from './stub-index-resolve-broker';
import { stubIndexResolveBrokerProxy } from './stub-index-resolve-broker.proxy';
import { RepoPathStub } from '../../../contracts/repo-path/repo-path.stub';

describe('stubIndexResolveBroker', () => {
  it('VALID: {stub index on disk, no overlay} => returns the derived stubs as the merged StubView', async () => {
    const proxy = stubIndexResolveBrokerProxy();
    const index = StubIndexStub();
    proxy.setup({
      repoPath: '/repo',
      namespace: 'main',
      manifest: AssayerCacheManifestStub({ namespaces: { main: { files: [{ relPath: 'a.ts', contentHash: 'a'.repeat(64) }] } } }),
      index,
    });

    const result = await stubIndexResolveBroker({ repoPath: RepoPathStub({ value: '/repo' }) });

    expect(result).toStrictEqual({ objectStubs: [ObjectStubStub()], envStubs: [] });
  });

  it('VALID: {stub index + committed overlay correcting mode} => the corrected values REPLACE the derived demand', async () => {
    const proxy = stubIndexResolveBrokerProxy();
    proxy.setup({
      repoPath: '/repo',
      namespace: 'main',
      manifest: AssayerCacheManifestStub({ namespaces: { main: { files: [{ relPath: 'a.ts', contentHash: 'a'.repeat(64) }] } } }),
      index: StubIndexStub(),
    });
    proxy.withObjectOverlay({
      repoPath: '/repo',
      definitionRelPath: 'src/config/config.ts',
      typeName: 'Config',
      properties: { mode: ['dev', 'prod', 'staging'] },
    });

    const result = await stubIndexResolveBroker({ repoPath: RepoPathStub({ value: '/repo' }) });

    expect(result).toStrictEqual({
      objectStubs: [
        ObjectStubStub({ properties: [{ name: 'mode', demand: { kind: 'demanded', values: ['dev', 'prod', 'staging'] } }] }),
      ],
      envStubs: [],
    });
  });

  it('EMPTY: {no cache manifest on disk} => returns an empty StubView', async () => {
    const proxy = stubIndexResolveBrokerProxy();
    proxy.setupMissingManifest({ repoPath: '/repo' });

    const result = await stubIndexResolveBroker({ repoPath: RepoPathStub({ value: '/repo' }) });

    expect(result).toStrictEqual({ objectStubs: [], envStubs: [] });
  });

  it('EMPTY: {manifest present but no stub index for the namespace} => returns an empty StubView', async () => {
    const proxy = stubIndexResolveBrokerProxy();
    proxy.setupNoIndex({
      repoPath: '/repo',
      namespace: 'main',
      manifest: AssayerCacheManifestStub({ namespaces: { main: { files: [{ relPath: 'a.ts', contentHash: 'a'.repeat(64) }] } } }),
    });

    const result = await stubIndexResolveBroker({ repoPath: RepoPathStub({ value: '/repo' }) });

    expect(result).toStrictEqual({ objectStubs: [], envStubs: [] });
  });
});
