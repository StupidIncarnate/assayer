import { AssayerCacheManifestStub } from '@assayer/shared/contracts';
import { cryptoSha256Adapter } from '../../../adapters/crypto/sha256/crypto-sha256-adapter';

import { stableNamespaceLayerBroker } from './stable-namespace-layer-broker';
import { stableNamespaceLayerBrokerProxy } from './stable-namespace-layer-broker.proxy';

describe('stableNamespaceLayerBroker', () => {
  describe('commit unchanged since the previous compile', () => {
    it('VALID: {previousManifest with matching commit} => returns mode skipped, reuses the previous files, no errors', async () => {
      const proxy = stableNamespaceLayerBrokerProxy();
      const sha = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0';
      proxy.unchanged({ sha });
      const previousManifest = AssayerCacheManifestStub();

      const result = await stableNamespaceLayerBroker({
        root: '/repo',
        branch: 'master',
        previousManifest,
        currentMax: 0,
        blobsDir: '/repo/.assayer/cache/blobs',
      });

      expect(result).toStrictEqual({
        resultEntry: { namespace: 'master', branch: 'master', mode: 'skipped', fileCount: 0 },
        manifestNamespace: {
          branch: 'master',
          commit: sha,
          files: [
            {
              relPath: 'packages/shared/src/index.ts',
              contentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            },
          ],
        },
        errors: [],
      });
      expect(proxy.processedCount()).toBe(0);
    });
  });

  describe('net-new run (no previous manifest)', () => {
    it('VALID: {previousManifest: undefined, one clean stable file} => returns mode net-new with the processed file in the manifest namespace', async () => {
      const proxy = stableNamespaceLayerBrokerProxy();
      const sha = '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b';
      const content = 'export const stable = 1;\n';
      const hash = cryptoSha256Adapter({ content });
      proxy.changed({
        sha,
        lsTreeStdout: `100644 blob e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\tsrc/stable.ts\n`,
        fileContents: [content],
      });

      const result = await stableNamespaceLayerBroker({
        root: '/repo',
        branch: 'master',
        currentMax: 0,
        blobsDir: '/repo/.assayer/cache/blobs',
      });

      expect(result).toStrictEqual({
        resultEntry: { namespace: 'master', branch: 'master', mode: 'net-new', fileCount: 1 },
        manifestNamespace: {
          branch: 'master',
          commit: sha,
          files: [{ relPath: 'src/stable.ts', contentHash: hash }],
        },
        errors: [],
      });
    });
  });

  describe('incremental run (previous manifest has a different commit)', () => {
    it('VALID: {previousManifest with a different commit, one clean stable file} => returns mode incremental', async () => {
      const proxy = stableNamespaceLayerBrokerProxy();
      const sha = '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b';
      const content = 'export const stable = 2;\n';
      const hash = cryptoSha256Adapter({ content });
      proxy.changed({
        sha,
        lsTreeStdout: `100644 blob e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\tsrc/stable.ts\n`,
        fileContents: [content],
      });
      const previousManifest = AssayerCacheManifestStub();

      const result = await stableNamespaceLayerBroker({
        root: '/repo',
        branch: 'master',
        previousManifest,
        currentMax: 0,
        blobsDir: '/repo/.assayer/cache/blobs',
      });

      expect(result).toStrictEqual({
        resultEntry: { namespace: 'master', branch: 'master', mode: 'incremental', fileCount: 1 },
        manifestNamespace: {
          branch: 'master',
          commit: sha,
          files: [{ relPath: 'src/stable.ts', contentHash: hash }],
        },
        errors: [],
      });
    });
  });

  describe('the stable ref does not resolve to a commit', () => {
    it('EDGE: {ref cannot be resolved to a commit} => omits the commit field from the manifest namespace', async () => {
      const proxy = stableNamespaceLayerBrokerProxy();
      const content = 'export const stable = 1;\n';
      const hash = cryptoSha256Adapter({ content });
      proxy.changedCommitUnresolvable({
        lsTreeStdout: `100644 blob e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\tsrc/stable.ts\n`,
        fileContents: [content],
      });

      const result = await stableNamespaceLayerBroker({
        root: '/repo',
        branch: 'master',
        currentMax: 0,
        blobsDir: '/repo/.assayer/cache/blobs',
      });

      expect(result).toStrictEqual({
        resultEntry: { namespace: 'master', branch: 'master', mode: 'net-new', fileCount: 1 },
        manifestNamespace: { branch: 'master', files: [{ relPath: 'src/stable.ts', contentHash: hash }] },
        errors: [],
      });
    });
  });

  describe('a stable file that fails to parse', () => {
    it('ERROR: {one stable file with invalid syntax} => returns an error entry tagged with the stable namespace', async () => {
      const proxy = stableNamespaceLayerBrokerProxy();
      const sha = '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b';
      proxy.changed({
        sha,
        lsTreeStdout: `100644 blob e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\tsrc/broken.ts\n`,
        fileContents: ['const x = ;;;{{{'],
      });

      const result = await stableNamespaceLayerBroker({
        root: '/repo',
        branch: 'master',
        currentMax: 0,
        blobsDir: '/repo/.assayer/cache/blobs',
      });

      expect(result).toStrictEqual({
        resultEntry: { namespace: 'master', branch: 'master', mode: 'net-new', fileCount: 1 },
        manifestNamespace: { branch: 'master', commit: sha, files: [] },
        errors: [{ namespace: 'master', relPath: 'src/broken.ts', line: 1, column: 11, message: 'Expression expected.' }],
      });
    });
  });

  describe('onProgress callback provided', () => {
    it('VALID: {onProgress set, one clean stable file} => emits planned, advanced, and done events for the stable namespace in order', async () => {
      const proxy = stableNamespaceLayerBrokerProxy();
      const sha = '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b';
      const content = 'export const stable = 1;\n';
      proxy.changed({
        sha,
        lsTreeStdout: `100644 blob e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\tsrc/stable.ts\n`,
        fileContents: [content],
      });
      const events: unknown[] = [];

      await stableNamespaceLayerBroker({
        root: '/repo',
        branch: 'master',
        currentMax: 2,
        blobsDir: '/repo/.assayer/cache/blobs',
        onProgress: (event) => {
          events.push(event);
        },
      });

      expect(events).toStrictEqual([
        { namespace: 'master', branch: 'master', phase: 'planned', current: 0, max: 1, stableMax: 1, currentMax: 2 },
        { namespace: 'master', branch: 'master', phase: 'advanced', current: 1, max: 1, stableMax: 1, currentMax: 2 },
        { namespace: 'master', branch: 'master', phase: 'done', current: 1, max: 1, stableMax: 1, currentMax: 2 },
      ]);
    });
  });
});
