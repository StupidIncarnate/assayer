import { RunResultStub } from '@assayer/shared/contracts';

import { runEachLayerBroker } from './run-each-layer-broker';
import { runEachLayerBrokerProxy } from './run-each-layer-broker.proxy';

describe('runEachLayerBroker', () => {
  describe('running each remaining file', () => {
    it('VALID: {one file} => one saved result', async () => {
      const proxy = runEachLayerBrokerProxy();
      proxy.setupSource({ source: 'export const a = (): number => 1;\n' });

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
      proxy.setupSource({ source: 'export const a = (): number => 1;\n' });

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
});
