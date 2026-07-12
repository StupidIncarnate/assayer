import { nodeFsReadCacheBlobAdapter } from './node-fs-read-cache-blob-adapter';
import { nodeFsReadCacheBlobAdapterProxy } from './node-fs-read-cache-blob-adapter.proxy';
import { RepoPathStub } from '../../../contracts/repo-path/repo-path.stub';

describe('nodeFsReadCacheBlobAdapter', () => {
  describe('successful read', () => {
    it('VALID: {repoPath: "/repo", contentHash: "abc123"} => reads exact blob path and returns parsed JSON', async () => {
      const proxy = nodeFsReadCacheBlobAdapterProxy();

      proxy.returns({ content: '{"ok":true}' });

      const result = await nodeFsReadCacheBlobAdapter({
        repoPath: RepoPathStub({ value: '/repo' }),
        contentHash: 'abc123',
      });

      expect(result).toStrictEqual({ ok: true });
      expect(proxy.readPath()).toBe('/repo/.assayer/cache/blobs/abc123.json');
    });
  });

  describe('error cases', () => {
    it('ERROR: {contentHash: missing blob} => underlying fs error propagates unmodified', async () => {
      const proxy = nodeFsReadCacheBlobAdapterProxy();

      proxy.throws({ error: new Error('ENOENT: no such file or directory') });

      await expect(
        nodeFsReadCacheBlobAdapter({
          repoPath: RepoPathStub({ value: '/repo' }),
          contentHash: 'missing',
        })
      ).rejects.toThrow(/ENOENT/u);
    });
  });
});
