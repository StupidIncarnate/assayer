import { assayerCacheManifestContract } from './assayer-cache-manifest-contract';
import { AssayerCacheManifestStub } from './assayer-cache-manifest.stub';

const HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

describe('assayerCacheManifestContract', () => {
  describe('valid manifests', () => {
    it('VALID: {stub} => parses successfully', () => {
      const result = assayerCacheManifestContract.parse(AssayerCacheManifestStub());

      expect(result).toStrictEqual({
        assayerVersion: '1.0.0',
        configHash: HASH,
        namespaces: {
          master: {
            branch: 'master',
            commit: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
            files: [{ relPath: 'packages/shared/src/index.ts', contentHash: HASH }],
          },
        },
        repoName: 'assayer',
        rootFolderName: 'smoke-repo',
      });
    });

    it('VALID: {namespace with no commit} => parses without commit key', () => {
      const result = assayerCacheManifestContract.parse({
        assayerVersion: '1.0.0',
        configHash: HASH,
        namespaces: {
          master: { branch: 'master', files: [{ relPath: 'a.ts', contentHash: HASH }] },
        },
        repoName: 'assayer',
        rootFolderName: 'smoke-repo',
      });

      expect(result.namespaces.master).toStrictEqual({
        branch: 'master',
        files: [{ relPath: 'a.ts', contentHash: HASH }],
      });
    });
  });

  describe('invalid manifests', () => {
    it('INVALID: {configHash: "not-hex"} => throws validation error', () => {
      expect(() => {
        return assayerCacheManifestContract.parse({
          assayerVersion: '1.0.0',
          configHash: 'not-hex',
          namespaces: {},
          repoName: 'assayer',
          rootFolderName: 'smoke-repo',
        });
      }).toThrow(/Invalid/u);
    });

    it('INVALID: {missing repoName} => throws validation error', () => {
      expect(() => {
        return assayerCacheManifestContract.parse({
          assayerVersion: '1.0.0',
          configHash: HASH,
          namespaces: {},
          rootFolderName: 'smoke-repo',
        });
      }).toThrow(/Required/u);
    });
  });
});
