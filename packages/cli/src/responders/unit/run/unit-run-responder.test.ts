import { UnitRunResponder } from './unit-run-responder';
import { UnitRunResponderProxy } from './unit-run-responder.proxy';

describe('UnitRunResponder', () => {
  describe('a passing run', () => {
    it('VALID: {one path, all cases passed} => the report', async () => {
      const proxy = UnitRunResponderProxy();
      proxy.runsEachPath({ configDir: '/repo' });

      const result = await UnitRunResponder({
        configDir: '/repo',
        root: '/repo/src-root',
        argv: ['src/a.ts'],
        darkSpots: 'warn',
        deadSurface: 'error',
        inputGaps: 'error',
      });

      expect(String(result)).toBe('packages/syntax-repository/src/happy-path/boolean/and/and.ts  1/1 passed');
    });

    it('VALID: {several paths} => one run per path, each in the report', async () => {
      const proxy = UnitRunResponderProxy();
      proxy.runsEachPath({ configDir: '/repo' });

      const result = await UnitRunResponder({
        configDir: '/repo',
        root: '/repo/src-root',
        argv: ['src/a.ts', 'src/b.ts'],
        darkSpots: 'warn',
        deadSurface: 'error',
        inputGaps: 'error',
      });

      expect(String(result)).toBe(
        'packages/syntax-repository/src/happy-path/boolean/and/and.ts  1/1 passed\n' +
          'packages/syntax-repository/src/happy-path/boolean/and/and.ts  1/1 passed',
      );
    });

    it('VALID: {a configDir} => the run report is saved under it', async () => {
      const proxy = UnitRunResponderProxy();
      proxy.runsEachPath({ configDir: '/repo' });

      await UnitRunResponder({
        configDir: '/repo',
        root: '/repo/src-root',
        argv: ['src/a.ts'],
        darkSpots: 'warn',
        deadSurface: 'error',
        inputGaps: 'error',
      });

      expect(proxy.getSavedConsoles({ configDir: '/repo' })).toStrictEqual([
        'packages/syntax-repository/src/happy-path/boolean/and/and.ts  1/1 passed',
      ]);
    });
  });

  describe('no paths', () => {
    // Refused rather than quietly running the whole repo: a typo'd path would otherwise look
    // identical to a full pass.
    it('ERROR: {no paths} => throws the usage rather than running everything', async () => {
      UnitRunResponderProxy();

      await expect(
        UnitRunResponder({ configDir: '/repo', root: '/repo/src-root', argv: [], darkSpots: 'warn', deadSurface: 'error', inputGaps: 'error' }),
      ).rejects.toThrow(/no paths given/u);
    });
  });
});
