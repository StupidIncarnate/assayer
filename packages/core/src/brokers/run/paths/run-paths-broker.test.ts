import { RunResultStub } from '@assayer/shared/contracts';

import { runPathsBroker } from './run-paths-broker';
import { runPathsBrokerProxy } from './run-paths-broker.proxy';

describe('runPathsBroker', () => {
  describe('running a set of paths', () => {
    it('VALID: {one path} => one saved result', async () => {
      const proxy = runPathsBrokerProxy();
      proxy.coreRootFound();
      const resultA = RunResultStub({ relPath: 'src/a.ts' });
      proxy.runsEachPath({
        configDir: '/repo',
        root: '/repo',
        analyzerRoots: ['/core/src'],
        runs: [{ relPath: 'src/a.ts', result: resultA }],
      });

      const result = await runPathsBroker({
        configDir: '/repo',
        root: '/repo',
        relPaths: ['src/a.ts'],
        analyzerRoots: ['/core/src'],
      });

      expect(result).toStrictEqual([resultA]);
    });

    it('VALID: {three paths} => each path answers with its own result, in order', async () => {
      const proxy = runPathsBrokerProxy();
      proxy.coreRootFound();
      const resultA = RunResultStub({ relPath: 'src/a.ts' });
      const resultB = RunResultStub({ relPath: 'src/b.ts' });
      const resultC = RunResultStub({ relPath: 'src/c.ts' });
      proxy.runsEachPath({
        configDir: '/repo',
        root: '/repo',
        analyzerRoots: ['/core/src'],
        runs: [
          { relPath: 'src/a.ts', result: resultA },
          { relPath: 'src/b.ts', result: resultB },
          { relPath: 'src/c.ts', result: resultC },
        ],
      });

      const result = await runPathsBroker({
        configDir: '/repo',
        root: '/repo',
        relPaths: ['src/a.ts', 'src/b.ts', 'src/c.ts'],
        analyzerRoots: ['/core/src'],
      });

      expect(result).toStrictEqual([resultA, resultB, resultC]);
      expect(proxy.getCallsFor()).toStrictEqual([
        {
          relPaths: ['src/a.ts', 'src/b.ts', 'src/c.ts'],
          root: '/repo',
          cacheDir: '/repo/.assayer/cache',
        },
      ]);
    });

    it('EMPTY: {no paths} => no results', async () => {
      const proxy = runPathsBrokerProxy();
      proxy.coreRootFound();
      proxy.runsEachPath({
        configDir: '/repo',
        root: '/repo',
        analyzerRoots: ['/core/src'],
        runs: [],
      });

      const result = await runPathsBroker({
        configDir: '/repo',
        root: '/repo',
        relPaths: [],
        analyzerRoots: ['/core/src'],
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('a broken install', () => {
    // Named rather than guessed: without the package root there is no run-time module for the shim to
    // require, and a plausible-looking wrong path would fail much later and much less legibly.
    it('ERROR: {no probe-runtime.js in any ancestor} => throws naming the incomplete install', async () => {
      const proxy = runPathsBrokerProxy();
      proxy.coreRootMissing();

      await expect(
        runPathsBroker({ configDir: '/repo', root: '/repo', relPaths: ['src/a.ts'], analyzerRoots: ['/core/src'] }),
      ).rejects.toThrow(/cannot locate the @assayer\/core package root/u);
      expect(proxy.getCallsFor()).toStrictEqual([]);
    });
  });
});
