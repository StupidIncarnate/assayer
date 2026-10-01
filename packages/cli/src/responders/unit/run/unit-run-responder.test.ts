import { RunResultStub } from '@assayer/shared/contracts/run-result/run-result.stub';

import { UnitRunResponder } from './unit-run-responder';
import { UnitRunResponderProxy } from './unit-run-responder.proxy';

describe('UnitRunResponder', () => {
  describe('a passing run', () => {
    it('VALID: {one path, all cases passed} => the report', async () => {
      const proxy = UnitRunResponderProxy();
      proxy.runsEachPath({
        configDir: '/repo',
        root: '/repo/src-root',
        runs: [{ relPath: 'src/a.ts', result: RunResultStub({ relPath: 'src/a.ts' }) }],
      });

      const result = await UnitRunResponder({
        configDir: '/repo',
        root: '/repo/src-root',
        argv: ['src/a.ts'],
        darkSpots: 'warn',
        deadSurface: 'error',
        inputGaps: 'error',
      });

      expect(result).toBe('src/a.ts  1/1 passed');
    });

    it('VALID: {several paths} => one run per path, in the order given, each in the report', async () => {
      const proxy = UnitRunResponderProxy();
      proxy.runsEachPath({
        configDir: '/repo',
        root: '/repo/src-root',
        runs: [
          { relPath: 'src/a.ts', result: RunResultStub({ relPath: 'src/a.ts' }) },
          { relPath: 'src/b.ts', result: RunResultStub({ relPath: 'src/b.ts' }) },
        ],
      });

      const result = await UnitRunResponder({
        configDir: '/repo',
        root: '/repo/src-root',
        argv: ['src/a.ts', 'src/b.ts'],
        darkSpots: 'warn',
        deadSurface: 'error',
        inputGaps: 'error',
      });

      expect(result).toBe('src/a.ts  1/1 passed\nsrc/b.ts  1/1 passed');
      expect(proxy.getRunPathsCalls()).toStrictEqual([
        {
          relPaths: ['src/a.ts', 'src/b.ts'],
          root: '/repo/src-root',
          cacheDir: '/repo/.assayer/cache',
        },
      ]);
    });

    it('VALID: {a configDir} => the run report is saved under it', async () => {
      const proxy = UnitRunResponderProxy();
      proxy.runsEachPath({
        configDir: '/repo',
        root: '/repo/src-root',
        runs: [{ relPath: 'src/a.ts', result: RunResultStub({ relPath: 'src/a.ts' }) }],
      });

      await UnitRunResponder({
        configDir: '/repo',
        root: '/repo/src-root',
        argv: ['src/a.ts'],
        darkSpots: 'warn',
        deadSurface: 'error',
        inputGaps: 'error',
      });

      expect(proxy.getSavedConsoles({ configDir: '/repo' })).toStrictEqual(['src/a.ts  1/1 passed']);
    });
  });

  describe('no paths', () => {
    // Refused rather than quietly running the whole repo: a typo'd path would otherwise look
    // identical to a full pass.
    it('ERROR: {no paths} => throws the usage rather than running everything', async () => {
      const proxy = UnitRunResponderProxy();

      await expect(
        UnitRunResponder({ configDir: '/repo', root: '/repo/src-root', argv: [], darkSpots: 'warn', deadSurface: 'error', inputGaps: 'error' }),
      ).rejects.toThrow(/no paths given/u);
      expect(proxy.getRunPathsCalls()).toStrictEqual([]);
    });
  });
});
