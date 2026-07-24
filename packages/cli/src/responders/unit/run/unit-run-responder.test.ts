import { jestInterpretCaseAdapter, jestProbeRuntimeAdapter } from '@assayer/core/adapters';
import { RunResultStub, CaseResultStub, LintEntryStub, RelPathStub, DerivedTestCaseStub, CoverageIdStub } from '@assayer/shared/contracts';

import { unitReportFormatTransformer } from '../../../transformers/unit-report-format/unit-report-format-transformer';
import { CliExactOutputError } from '../../../errors/cli-exact-output/cli-exact-output-error';
import { UnitRunResponder } from './unit-run-responder';
import { UnitRunResponderProxy } from './unit-run-responder.proxy';

const MAP_EXIT = CoverageIdStub({ value: 'mapEach/return@top' });
const CLASSIFY_THEN = CoverageIdStub({ value: 'classify/return@then' });
const CLASSIFY_ELSE = CoverageIdStub({ value: 'classify/return@else' });

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

      expect(String(result)).toBe('packages/syntax-repository/src/happy-path/boolean/and/and.ts  1/1 passed');
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
        runs: [RunResultStub({ cases: [CaseResultStub({ status: 'failed', observedPath: ['grade/return@else'] })] })],
      });

      await expect(
        UnitRunResponder({ configDir: '/repo', root: '/repo/src-root', argv: ['src/a.ts'], darkSpots: 'warn', deadSurface: 'error' }),
      ).rejects.toThrow(/FAIL grade/u);
    });
  });

  // The soundness net. A DERIVED case is P4-sound — it asserts only that its arrange reaches the exit
  // derivation PREDICTED, never a returned value — so a derived case always passes and a green run
  // could be a rubber stamp. These two prove it is not: each drives the REAL interpreter over REAL
  // code with a case HAND-CONSTRUCTED to be unreachable, so EXECUTION (not a mock) produces the
  // failure, and the REAL formatter renders it as the exact FAIL text `assayer unit` throws to leave a
  // non-zero exit behind. The runPathsBroker mock only stands in for the compile that would derive the
  // sound cases; the failing case fed through it is the interpreter's own output.
  describe('fails loudly — the P4 soundness net', () => {
    it('ERROR: {a string arranged where the entry maps an array} => the real run FAILS with the throw, and assayer unit throws that exact report', async () => {
      const proxy = UnitRunResponderProxy();
      const probe = jestProbeRuntimeAdapter();

      const testCase = DerivedTestCaseStub({
        reachesPath: [MAP_EXIT],
        arrange: [{ kind: 'param', param: 'items', value: 'oops' }],
      });
      // Real instrumented code `(items) => items.map(...)`. Arranging a STRING makes `.map` throw
      // inside the instrumented call before any exit fires — the interpreter reports the throw and
      // could not report a pass if it wanted to.
      const result = jestInterpretCaseAdapter({
        entry: (items: number[]) => probe.x(MAP_EXIT, items.map((n) => n + 1)),
        entryName: 'mapEach',
        exitIds: [MAP_EXIT],
        testCase,
        probe,
      });

      expect(result).toStrictEqual({
        entryName: 'mapEach',
        testCase,
        status: 'failed',
        observedPath: [],
        trace: [],
        message: 'threw before reaching an exit: items.map is not a function',
      });

      const runs = [RunResultStub({ runId: 'r-soundness-net', relPath: 'src/wrong-type-arrange.ts', cases: [result] })];
      const report =
        'src/wrong-type-arrange.ts  0/1 passed\n' +
        '  FAIL mapEach("oops")\n' +
        '    predicted mapEach/return@top\n' +
        '    threw before reaching an exit: items.map is not a function\n' +
        '  assayer detail r-soundness-net';

      // The real formatter renders the throw verbatim as the FAIL block a reader acts on.
      expect(String(unitReportFormatTransformer({ runs }))).toBe(report);

      // assayer unit throws that exact text, so a failing run leaves a non-zero exit code behind.
      proxy.runsReturn({ runs });

      await expect(
        UnitRunResponder({ configDir: '/repo', root: '/repo/src-root', argv: ['src/wrong-type-arrange.ts'], darkSpots: 'warn', deadSurface: 'error' }),
      ).rejects.toThrow(new CliExactOutputError({ message: report }));
    });

    it('ERROR: {an arrange that reaches an exit the case did not predict} => the real run FAILS on the wrong path, and assayer unit throws that exact report', async () => {
      const proxy = UnitRunResponderProxy();
      const probe = jestProbeRuntimeAdapter();

      const testCase = DerivedTestCaseStub({
        reachesPath: [CLASSIFY_THEN],
        arrange: [{ kind: 'param', param: 'score', value: 0 }],
      });
      // The arrange drives the flow to the ELSE exit, but the case PREDICTED the THEN exit — the
      // observed path's suffix does not equal the predicted path, so the interpreter fails it.
      const result = jestInterpretCaseAdapter({
        entry: (score: number) => probe.x(CLASSIFY_ELSE, score),
        entryName: 'classify',
        exitIds: [CLASSIFY_THEN, CLASSIFY_ELSE],
        testCase,
        probe,
      });

      expect(result).toStrictEqual({
        entryName: 'classify',
        testCase,
        status: 'failed',
        observedPath: [CLASSIFY_ELSE],
        trace: [{ id: CLASSIFY_ELSE, kind: 'exit', valueText: '0' }],
      });

      const runs = [RunResultStub({ runId: 'r-soundness-net', relPath: 'src/wrong-predicted-path.ts', cases: [result] })];
      const report =
        'src/wrong-predicted-path.ts  0/1 passed\n' +
        '  FAIL classify(0)\n' +
        '    predicted classify/return@then\n' +
        '    reached classify/return@else\n' +
        '  assayer detail r-soundness-net';

      expect(String(unitReportFormatTransformer({ runs }))).toBe(report);

      proxy.runsReturn({ runs });

      await expect(
        UnitRunResponder({ configDir: '/repo', root: '/repo/src-root', argv: ['src/wrong-predicted-path.ts'], darkSpots: 'warn', deadSurface: 'error' }),
      ).rejects.toThrow(new CliExactOutputError({ message: report }));
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
        'packages/syntax-repository/src/happy-path/boolean/and/and.ts  1/1 passed\n' +
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
