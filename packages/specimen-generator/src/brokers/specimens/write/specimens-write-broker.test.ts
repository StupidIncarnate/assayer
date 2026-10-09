import { GeneratedFileStub } from '../../../contracts/generated-file/generated-file.stub';
import { GenerationResultStub } from '../../../contracts/generation-result/generation-result.stub';
import { specimensWriteBroker } from './specimens-write-broker';
import { specimensWriteBrokerProxy } from './specimens-write-broker.proxy';

const OUT_ROOT = '/repo/smoke-repo/packages/syntax-repository';

describe('specimensWriteBroker', () => {
  describe('clearing what the generator owns', () => {
    it('VALID: {a result with files} => removes src, the manifest and the refusals file, in that order', () => {
      const proxy = specimensWriteBrokerProxy();
      proxy.setupWritableRoot({ outRoot: OUT_ROOT });
      const result = GenerationResultStub({
        files: [GeneratedFileStub({ relPath: 'src/if/a/a.ts', content: 'export {};\n' })],
      });

      specimensWriteBroker({ outRoot: OUT_ROOT, result });

      expect(proxy.removedPaths({ outRoot: OUT_ROOT })).toStrictEqual([
        [`${OUT_ROOT}/src`, { recursive: true, force: true }],
        [`${OUT_ROOT}/specimen-manifest.json`, { force: true }],
        [`${OUT_ROOT}/REFUSED.md`, { force: true }],
      ]);
    });

    it('EMPTY: {a result with no files} => still clears the three paths and writes nothing', () => {
      const proxy = specimensWriteBrokerProxy();
      proxy.setupWritableRoot({ outRoot: OUT_ROOT });
      const result = GenerationResultStub({ files: [] });

      const written = specimensWriteBroker({ outRoot: OUT_ROOT, result });

      expect({
        written,
        removed: proxy.removedPaths({ outRoot: OUT_ROOT }),
        config: proxy.writeCallsFor({ outRoot: OUT_ROOT, relPath: 'package.json' }),
      }).toStrictEqual({
        written: 0,
        removed: [
          [`${OUT_ROOT}/src`, { recursive: true, force: true }],
          [`${OUT_ROOT}/specimen-manifest.json`, { force: true }],
          [`${OUT_ROOT}/REFUSED.md`, { force: true }],
        ],
        config: [],
      });
    });
  });

  describe('writing the result', () => {
    it('VALID: {a specimen, its test, the manifest and the refusals file} => writes each at its path under the root and returns four', () => {
      const proxy = specimensWriteBrokerProxy();
      proxy.setupWritableRoot({ outRoot: OUT_ROOT });
      const result = GenerationResultStub({
        files: [
          GeneratedFileStub({ relPath: 'src/if/a/a.test.ts', content: 'test text\n' }),
          GeneratedFileStub({ relPath: 'specimen-manifest.json', content: '[]\n' }),
          GeneratedFileStub({ relPath: 'src/if/a/a.ts', content: 'export {};\n' }),
          GeneratedFileStub({ relPath: 'REFUSED.md', content: 'none\n' }),
        ],
      });

      const written = specimensWriteBroker({ outRoot: OUT_ROOT, result });

      expect({
        written,
        specimen: proxy.writtenContent({ outRoot: OUT_ROOT, relPath: 'src/if/a/a.ts' }),
        test: proxy.writtenContent({ outRoot: OUT_ROOT, relPath: 'src/if/a/a.test.ts' }),
        manifest: proxy.writtenContent({ outRoot: OUT_ROOT, relPath: 'specimen-manifest.json' }),
        refused: proxy.writtenContent({ outRoot: OUT_ROOT, relPath: 'REFUSED.md' }),
      }).toStrictEqual({
        written: 4,
        specimen: 'export {};\n',
        test: 'test text\n',
        manifest: '[]\n',
        refused: 'none\n',
      });
    });

    it('VALID: {a result} => leaves the hand-written config files alone', () => {
      const proxy = specimensWriteBrokerProxy();
      proxy.setupWritableRoot({ outRoot: OUT_ROOT });
      const result = GenerationResultStub({
        files: [GeneratedFileStub({ relPath: 'src/if/a/a.ts', content: 'export {};\n' })],
      });

      specimensWriteBroker({ outRoot: OUT_ROOT, result });

      expect({
        packageJson: proxy.writeCallsFor({ outRoot: OUT_ROOT, relPath: 'package.json' }),
        tsconfig: proxy.writeCallsFor({ outRoot: OUT_ROOT, relPath: 'tsconfig.json' }),
        jestConfig: proxy.writeCallsFor({ outRoot: OUT_ROOT, relPath: 'jest.config.js' }),
        removed: proxy.removedPaths({ outRoot: OUT_ROOT }),
      }).toStrictEqual({
        packageJson: [],
        tsconfig: [],
        jestConfig: [],
        removed: [
          [`${OUT_ROOT}/src`, { recursive: true, force: true }],
          [`${OUT_ROOT}/specimen-manifest.json`, { force: true }],
          [`${OUT_ROOT}/REFUSED.md`, { force: true }],
        ],
      });
    });
  });

  describe('a write that fails', () => {
    it('ERROR: {the specimen path is not writable} => throws the raw error', () => {
      const proxy = specimensWriteBrokerProxy();
      proxy.setupWritableRoot({ outRoot: OUT_ROOT });
      proxy.setupWriteDenied({ outRoot: OUT_ROOT, relPath: 'src/if/a/a.ts' });
      const result = GenerationResultStub({
        files: [GeneratedFileStub({ relPath: 'src/if/a/a.ts', content: 'export {};\n' })],
      });

      expect(() => {
        specimensWriteBroker({ outRoot: OUT_ROOT, result });
      }).toThrow(/^EACCES: open '\/repo\/smoke-repo\/packages\/syntax-repository\/src\/if\/a\/a\.ts'$/u);
    });
  });
});
