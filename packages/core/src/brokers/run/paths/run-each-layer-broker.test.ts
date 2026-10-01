import { RunResultStub } from '@assayer/shared/contracts/run-result/run-result.stub';

import { runEachLayerBroker } from './run-each-layer-broker';
import { runEachLayerBrokerProxy } from './run-each-layer-broker.proxy';

const SOURCE = 'export const a = (): number => 1;\n';

describe('runEachLayerBroker', () => {
  describe('running each remaining file', () => {
    it('VALID: {one file} => one saved result', async () => {
      const proxy = runEachLayerBrokerProxy();
      proxy.setupSource({ sourcePath: '/repo/src/a.ts', harnessPath: '/repo/src/a.harness.ts', source: SOURCE });

      const result = await runEachLayerBroker({
        remaining: ['src/a.ts'],
        root: '/repo',
        cacheDir: '/repo/.assayer/cache',
        coreRoot: '/core',
        analyzerContentHash: 'abc',
        results: [],
      });

      expect(result).toStrictEqual([RunResultStub()]);
    });

    it('VALID: {three files} => one result each, in the order given', async () => {
      const proxy = runEachLayerBrokerProxy();
      proxy.setupSource({ sourcePath: '/repo/src/a.ts', harnessPath: '/repo/src/a.harness.ts', source: SOURCE });
      proxy.setupSource({ sourcePath: '/repo/src/b.ts', harnessPath: '/repo/src/b.harness.ts', source: SOURCE });
      proxy.setupSource({ sourcePath: '/repo/src/c.ts', harnessPath: '/repo/src/c.harness.ts', source: SOURCE });

      const result = await runEachLayerBroker({
        remaining: ['src/a.ts', 'src/b.ts', 'src/c.ts'],
        root: '/repo',
        cacheDir: '/repo/.assayer/cache',
        coreRoot: '/core',
        analyzerContentHash: 'abc',
        results: [],
      });

      expect(result).toStrictEqual([RunResultStub(), RunResultStub(), RunResultStub()]);
    });
  });

  describe('nothing to run', () => {
    // An empty set is an answer, not an error: "these paths hold nothing runnable" must stay sayable.
    it('EMPTY: {no files} => the results it was given', async () => {
      runEachLayerBrokerProxy();

      const result = await runEachLayerBroker({
        remaining: [],
        root: '/repo',
        cacheDir: '/repo/.assayer/cache',
        coreRoot: '/core',
        analyzerContentHash: 'abc',
        results: [],
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('a file that cannot be read', () => {
    it('ERROR: {relPath: the read is denied with EACCES} => propagates the filesystem error unmodified, since the read is never wrapped in try/catch', async () => {
      const proxy = runEachLayerBrokerProxy();
      proxy.readDenied({ sourcePath: '/repo/src/a.ts' });

      await expect(
        runEachLayerBroker({
          remaining: ['src/a.ts'],
          root: '/repo',
          cacheDir: '/repo/.assayer/cache',
          coreRoot: '/core',
          analyzerContentHash: 'abc',
          results: [],
        }),
      ).rejects.toThrow(/^EACCES: op '\/repo\/src\/a\.ts'$/u);
    });
  });
});
