import { AssayerCacheManifestStub } from '@assayer/shared/contracts';

import { currentNamespaceTransformer } from './current-namespace-transformer';

describe('currentNamespaceTransformer', () => {
  describe('resolving the current namespace', () => {
    it('VALID: {namespaces: main w/ commit, master w/o commit} => returns master', () => {
      const manifest = AssayerCacheManifestStub({
        namespaces: {
          main: {
            commit: 'a'.repeat(40),
            files: [{ relPath: 'a.ts', contentHash: 'a'.repeat(64) }],
          },
          master: {
            files: [{ relPath: 'm.ts', contentHash: 'b'.repeat(64) }],
          },
        },
      });

      const result = currentNamespaceTransformer({ manifest });

      expect(result).toStrictEqual({
        namespaceName: 'master',
        files: [{ relPath: 'm.ts', contentHash: 'b'.repeat(64) }],
      });
    });

    it('EDGE: {namespaces: single commitless "default"} => returns default', () => {
      const manifest = AssayerCacheManifestStub({
        namespaces: {
          default: {
            files: [{ relPath: 'x.ts', contentHash: 'c'.repeat(64) }],
          },
        },
      });

      const result = currentNamespaceTransformer({ manifest });

      expect(result).toStrictEqual({
        namespaceName: 'default',
        files: [{ relPath: 'x.ts', contentHash: 'c'.repeat(64) }],
      });
    });

    it('ERROR: {namespaces: every entry has a commit} => throws naming all keys', () => {
      const manifest = AssayerCacheManifestStub({
        namespaces: {
          main: { commit: 'd'.repeat(40), files: [] },
          master: { commit: 'e'.repeat(40), files: [] },
        },
      });

      expect(() => currentNamespaceTransformer({ manifest })).toThrow(/main/u);
      expect(() => currentNamespaceTransformer({ manifest })).toThrow(/master/u);
    });
  });
});
