import { GeneratedFileStub } from '../../../contracts/generated-file/generated-file.stub';
import { GenerationResultStub } from '../../../contracts/generation-result/generation-result.stub';
import { SpecimenDriftStub } from '../../../contracts/specimen-drift/specimen-drift.stub';
import { specimensCheckBroker } from './specimens-check-broker';
import { specimensCheckBrokerProxy } from './specimens-check-broker.proxy';

const OUT_ROOT = '/repo/smoke-repo/packages/syntax-repository';

describe('specimensCheckBroker', () => {
  describe('output that is current', () => {
    it('VALID: {every generated file is on disk with the same text} => returns no drift', () => {
      const proxy = specimensCheckBrokerProxy();
      proxy.setupExistingTree({
        outRoot: OUT_ROOT,
        files: [
          { relPath: 'src/if/a/a.ts', content: 'export {};\n' },
          { relPath: 'src/if/a/a.test.ts', content: 'test\n' },
          { relPath: 'specimen-manifest.json', content: '[]\n' },
          { relPath: 'REFUSED.md', content: 'none\n' },
        ],
      });
      const result = GenerationResultStub({
        files: [
          GeneratedFileStub({ relPath: 'src/if/a/a.ts', content: 'export {};\n' }),
          GeneratedFileStub({ relPath: 'src/if/a/a.test.ts', content: 'test\n' }),
          GeneratedFileStub({ relPath: 'specimen-manifest.json', content: '[]\n' }),
          GeneratedFileStub({ relPath: 'REFUSED.md', content: 'none\n' }),
        ],
      });

      const drift = specimensCheckBroker({ outRoot: OUT_ROOT, result });

      expect(drift).toStrictEqual([]);
    });

    it('EMPTY: {nothing generated and nothing on disk} => returns no drift', () => {
      const proxy = specimensCheckBrokerProxy();
      proxy.setupExistingTree({ outRoot: OUT_ROOT, files: [] });
      const result = GenerationResultStub({ files: [] });

      const drift = specimensCheckBroker({ outRoot: OUT_ROOT, result });

      expect(drift).toStrictEqual([]);
    });
  });

  describe('output that has drifted', () => {
    it('VALID: {a file on disk has other text} => reports it as differs', () => {
      const proxy = specimensCheckBrokerProxy();
      proxy.setupExistingTree({
        outRoot: OUT_ROOT,
        files: [{ relPath: 'src/if/a/a.ts', content: 'export const old = 1;\n' }],
      });
      const result = GenerationResultStub({
        files: [GeneratedFileStub({ relPath: 'src/if/a/a.ts', content: 'export {};\n' })],
      });

      const drift = specimensCheckBroker({ outRoot: OUT_ROOT, result });

      expect(drift).toStrictEqual([
        SpecimenDriftStub({ relPath: 'src/if/a/a.ts', problem: 'differs' }),
      ]);
    });

    it('VALID: {a generated file is not on disk} => reports it as missing', () => {
      const proxy = specimensCheckBrokerProxy();
      proxy.setupExistingTree({ outRoot: OUT_ROOT, files: [] });
      const result = GenerationResultStub({
        files: [GeneratedFileStub({ relPath: 'src/if/a/a.ts', content: 'export {};\n' })],
      });

      const drift = specimensCheckBroker({ outRoot: OUT_ROOT, result });

      expect(drift).toStrictEqual([
        SpecimenDriftStub({ relPath: 'src/if/a/a.ts', problem: 'missing' }),
      ]);
    });

    it('VALID: {a manifest is generated but absent on disk} => reports it as missing', () => {
      const proxy = specimensCheckBrokerProxy();
      proxy.setupExistingTree({ outRoot: OUT_ROOT, files: [] });
      const result = GenerationResultStub({
        files: [GeneratedFileStub({ relPath: 'specimen-manifest.json', content: '[]\n' })],
      });

      const drift = specimensCheckBroker({ outRoot: OUT_ROOT, result });

      expect(drift).toStrictEqual([
        SpecimenDriftStub({ relPath: 'specimen-manifest.json', problem: 'missing' }),
      ]);
    });

    it('VALID: {a file under src that was not generated} => reports it as extra', () => {
      const proxy = specimensCheckBrokerProxy();
      proxy.setupExistingTree({
        outRoot: OUT_ROOT,
        files: [{ relPath: 'src/if/stale/stale.ts', content: 'export {};\n' }],
      });
      const result = GenerationResultStub({ files: [] });

      const drift = specimensCheckBroker({ outRoot: OUT_ROOT, result });

      expect(drift).toStrictEqual([
        SpecimenDriftStub({ relPath: 'src/if/stale/stale.ts', problem: 'extra' }),
      ]);
    });

    it('VALID: {a refusals file on disk that was not generated} => reports it as extra', () => {
      const proxy = specimensCheckBrokerProxy();
      proxy.setupExistingTree({
        outRoot: OUT_ROOT,
        files: [{ relPath: 'REFUSED.md', content: 'old\n' }],
      });
      const result = GenerationResultStub({ files: [] });

      const drift = specimensCheckBroker({ outRoot: OUT_ROOT, result });

      expect(drift).toStrictEqual([SpecimenDriftStub({ relPath: 'REFUSED.md', problem: 'extra' })]);
    });

    it('VALID: {all three problems at once} => returns them sorted by path', () => {
      const proxy = specimensCheckBrokerProxy();
      proxy.setupExistingTree({
        outRoot: OUT_ROOT,
        files: [
          { relPath: 'src/z/z.ts', content: 'export {};\n' },
          { relPath: 'src/b/b.ts', content: 'old\n' },
          { relPath: 'REFUSED.md', content: 'old\n' },
        ],
      });
      const result = GenerationResultStub({
        files: [
          GeneratedFileStub({ relPath: 'src/b/b.ts', content: 'new\n' }),
          GeneratedFileStub({ relPath: 'src/a/a.ts', content: 'export {};\n' }),
        ],
      });

      const drift = specimensCheckBroker({ outRoot: OUT_ROOT, result });

      expect(drift).toStrictEqual([
        SpecimenDriftStub({ relPath: 'REFUSED.md', problem: 'extra' }),
        SpecimenDriftStub({ relPath: 'src/a/a.ts', problem: 'missing' }),
        SpecimenDriftStub({ relPath: 'src/b/b.ts', problem: 'differs' }),
        SpecimenDriftStub({ relPath: 'src/z/z.ts', problem: 'extra' }),
      ]);
    });
  });
});
