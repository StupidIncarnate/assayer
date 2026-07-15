import { RunResultStub } from '@assayer/shared/contracts';

import { runPathsBroker } from './run-paths-broker';
import { runPathsBrokerProxy } from './run-paths-broker.proxy';

describe('runPathsBroker', () => {
  describe('running a set of paths', () => {
    it('VALID: {one path} => one saved result', async () => {
      runPathsBrokerProxy();

      const result = await runPathsBroker({
        configDir: '/repo',
        root: '/repo',
        relPaths: ['src/a.ts'],
        analyzerRoots: ['/core/src'],
      });

      expect(result).toStrictEqual([RunResultStub()]);
    });

    it('VALID: {three paths} => one result each', async () => {
      runPathsBrokerProxy();

      const result = await runPathsBroker({
        configDir: '/repo',
        root: '/repo',
        relPaths: ['src/a.ts', 'src/b.ts', 'src/c.ts'],
        analyzerRoots: ['/core/src'],
      });

      expect(result).toStrictEqual([RunResultStub(), RunResultStub(), RunResultStub()]);
    });

    it('EMPTY: {no paths} => no results', async () => {
      runPathsBrokerProxy();

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
    // Named rather than guessed: without the package root there is no built adapter for the shim to
    // require, and a plausible-looking wrong path would fail much later and much less legibly.
    it('ERROR: {no probe-runtime.js in any ancestor} => throws naming the incomplete install', async () => {
      const proxy = runPathsBrokerProxy();
      proxy.coreRootMissing();

      await expect(
        runPathsBroker({ configDir: '/repo', root: '/repo', relPaths: ['src/a.ts'], analyzerRoots: ['/core/src'] }),
      ).rejects.toThrow(/cannot locate the @assayer\/core package root/u);
    });
  });
});
