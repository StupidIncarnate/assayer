import { RunResultStub, CaseResultStub, LintEntryStub, RelPathStub } from '@assayer/shared/contracts';

import { UnitRunResponder } from './unit-run-responder';
import { UnitRunResponderProxy } from './unit-run-responder.proxy';

describe('UnitRunResponder', () => {
  describe('a passing run', () => {
    it('VALID: {one path, all cases passed} => the report', async () => {
      UnitRunResponderProxy();

      const result = await UnitRunResponder({
        configDir: '/repo',
        root: '/repo/src-root',
        argv: ['src/a.ts'],
        darkSpots: 'warn',
        deadSurface: 'error',
      });

      expect(String(result)).toBe('packages/syntax-repository/src/boolean/and.ts  1/1 passed');
    });

    it('VALID: {several paths} => are handed to the broker as given, in order', async () => {
      const proxy = UnitRunResponderProxy();

      await UnitRunResponder({
        configDir: '/repo',
        root: '/repo/src-root',
        argv: ['src/a.ts', 'src/b.ts'],
        darkSpots: 'warn',
        deadSurface: 'error',
      });

      expect(proxy.getRelPaths()).toStrictEqual([RelPathStub({ value: 'src/a.ts' }), RelPathStub({ value: 'src/b.ts' })]);
    });

    it('VALID: {a configDir} => is where the run reads and writes', async () => {
      const proxy = UnitRunResponderProxy();

      await UnitRunResponder({
        configDir: '/repo',
        root: '/repo/src-root',
        argv: ['src/a.ts'],
        darkSpots: 'warn',
        deadSurface: 'error',
      });

      expect(proxy.getConfigDir()).toBe(RelPathStub({ value: '/repo' }));
    });
  });

  describe('a failing run', () => {
    // THROWN, not returned: a derived case that misses the exit derivation predicted is a build
    // error, so it must leave a non-zero exit code behind or CI goes green over it.
    it('ERROR: {a failed case} => throws the report, so the exit code is non-zero', async () => {
      const proxy = UnitRunResponderProxy();
      proxy.runsReturn({
        runs: [RunResultStub({ cases: [CaseResultStub({ status: 'failed', observedExit: 'grade/return@else' })] })],
      });

      await expect(
        UnitRunResponder({ configDir: '/repo', root: '/repo/src-root', argv: ['src/a.ts'], darkSpots: 'warn', deadSurface: 'error' }),
      ).rejects.toThrow(/FAIL grade/u);
    });
  });

  describe('a run with dead surface', () => {
    // A lint fails the build when the repo asked (`deadSurface: 'error'`), because dead code is the
    // repo's debt — the same exit-code path a dark spot takes under its own toggle.
    it('ERROR: {a dead-surface lint, deadSurface: error} => throws the report, so the exit code is non-zero', async () => {
      const proxy = UnitRunResponderProxy();
      proxy.runsReturn({ runs: [RunResultStub({ lints: [LintEntryStub()] })] });

      await expect(
        UnitRunResponder({ configDir: '/repo', root: '/repo/src-root', argv: ['src/a.ts'], darkSpots: 'warn', deadSurface: 'error' }),
      ).rejects.toThrow(/LINT decide/u);
    });

    // The same lint under `warn` is REPORTED but does not fail the run — the report names it either
    // way; the severity decides only whether the exit code follows.
    it('VALID: {a dead-surface lint, deadSurface: warn} => reports it without failing the run', async () => {
      const proxy = UnitRunResponderProxy();
      proxy.runsReturn({ runs: [RunResultStub({ lints: [LintEntryStub()] })] });

      const result = await UnitRunResponder({
        configDir: '/repo',
        root: '/repo/src-root',
        argv: ['src/a.ts'],
        darkSpots: 'warn',
        deadSurface: 'warn',
      });

      expect(String(result)).toBe(
        'packages/syntax-repository/src/boolean/and.ts  1/1 passed\n' +
          '  LINT decide — nothing in this file calls it, so it is dead surface',
      );
    });
  });

  describe('no paths', () => {
    // Refused rather than quietly running the whole repo: a typo'd path would otherwise look
    // identical to a full pass.
    it('ERROR: {no paths} => throws the usage rather than running everything', async () => {
      UnitRunResponderProxy();

      await expect(
        UnitRunResponder({ configDir: '/repo', root: '/repo/src-root', argv: [], darkSpots: 'warn', deadSurface: 'error' }),
      ).rejects.toThrow(/no paths given/u);
    });
  });
});
