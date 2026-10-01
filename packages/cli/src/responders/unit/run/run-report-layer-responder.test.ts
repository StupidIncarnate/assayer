import { caseInterpretBroker, probeRuntimeCreateBroker } from '@assayer/core/adapters';
import { RunResultStub, CaseResultStub, DarkSpotStub, EntryGapStub, LintEntryStub, DerivedTestCaseStub, CoverageIdStub } from '@assayer/shared/contracts';

import { unitReportFormatTransformer } from '../../../transformers/unit-report-format/unit-report-format-transformer';
import { CliExactOutputError } from '../../../errors/cli-exact-output/cli-exact-output-error';
import { RunReportLayerResponder } from './run-report-layer-responder';
import { RunReportLayerResponderProxy } from './run-report-layer-responder.proxy';

const MAP_EXIT = CoverageIdStub({ value: 'mapEach/return@top' });
const CLASSIFY_THEN = CoverageIdStub({ value: 'classify/return@then' });
const CLASSIFY_ELSE = CoverageIdStub({ value: 'classify/return@else' });

describe('RunReportLayerResponder', () => {
  describe('a passing run', () => {
    it('VALID: {one run, all cases passed} => returns the report', async () => {
      const proxy = RunReportLayerResponderProxy();
      proxy.saveSucceeds({ configDir: '/repo', runId: 'r-1784093000000' });

      const result = await RunReportLayerResponder({
        configDir: '/repo',
        runs: [RunResultStub()],
        darkSpots: 'warn',
        deadSurface: 'error',
        inputGaps: 'error',
      });

      expect(String(result)).toBe('packages/syntax-repository/src/happy-path/boolean/and/and.ts  1/1 passed');
    });
  });

  // Saved so the desktop can show what a run SAID without re-running it, and so it shows the CLI's
  // real bytes rather than re-formatting the artifact into a second telling that can drift.
  describe('the report it saves beside each run', () => {
    it('VALID: {a run} => its report is saved under that run id, inside configDir', async () => {
      const proxy = RunReportLayerResponderProxy();
      proxy.saveSucceeds({ configDir: '/repo', runId: 'r-1784093000000' });

      await RunReportLayerResponder({
        configDir: '/repo',
        runs: [RunResultStub()],
        darkSpots: 'warn',
        deadSurface: 'error',
        inputGaps: 'error',
      });

      expect(proxy.getSavedConsoles({ configDir: '/repo', runId: 'r-1784093000000' })).toStrictEqual([
        'packages/syntax-repository/src/happy-path/boolean/and/and.ts  1/1 passed',
      ]);
    });

    // `assayer unit a.ts b.ts` prints ONE report for two runs, but each run saves only its own slice.
    // Saving the whole report against both ids would show a reader opening `a.ts` the failures of
    // `b.ts`, attributed to the file they are looking at.
    it('VALID: {two runs in one invocation} => each saves only its OWN slice, never the combined report', async () => {
      const proxy = RunReportLayerResponderProxy();
      proxy.saveSucceeds({ configDir: '/repo', runId: 'r-a' });
      proxy.saveSucceeds({ configDir: '/repo', runId: 'r-b' });

      await expect(
        RunReportLayerResponder({
          configDir: '/repo',
          runs: [
            RunResultStub({ runId: 'r-a', relPath: 'src/a.ts' }),
            RunResultStub({
              runId: 'r-b',
              relPath: 'src/b.ts',
              cases: [CaseResultStub({ status: 'errored', observedPath: [], message: 'threw before reaching an exit: boom' })],
            }),
          ],
          darkSpots: 'warn',
          deadSurface: 'error',
          inputGaps: 'error',
        }),
      ).rejects.toThrow(CliExactOutputError);

      expect({
        a: proxy.getSavedConsoles({ configDir: '/repo', runId: 'r-a' }),
        b: proxy.getSavedConsoles({ configDir: '/repo', runId: 'r-b' }),
      }).toStrictEqual({
        a: ['src/a.ts  1/1 passed'],
        b: [
          'src/b.ts  0/1 passed\n' +
            '  ERROR grade(6, 2)\n' +
            '    threw before reaching an exit: boom\n' +
            '  assayer detail r-b',
        ],
      });
    });

    // Saved BEFORE the exit code is decided. A failing run is exactly the one whose report a reader
    // needs to open later, so throwing first would persist reports only for runs nobody needs.
    it('VALID: {a failing run} => the report is still saved, not lost to the throw', async () => {
      const proxy = RunReportLayerResponderProxy();
      proxy.saveSucceeds({ configDir: '/repo', runId: 'r-fail' });

      await expect(
        RunReportLayerResponder({
          configDir: '/repo',
          runs: [
            RunResultStub({
              runId: 'r-fail',
              relPath: 'src/a.ts',
              cases: [CaseResultStub({ status: 'errored', observedPath: [], message: 'threw before reaching an exit: boom' })],
            }),
          ],
          darkSpots: 'warn',
          deadSurface: 'error',
          inputGaps: 'error',
        }),
      ).rejects.toThrow(CliExactOutputError);

      expect(proxy.getSavedConsoles({ configDir: '/repo', runId: 'r-fail' })).toStrictEqual([
        'src/a.ts  0/1 passed\n' +
          '  ERROR grade(6, 2)\n' +
          '    threw before reaching an exit: boom\n' +
          '  assayer detail r-fail',
      ]);
    });
  });

  describe('a failing run', () => {
    // THROWN, not returned: a derived case that misses the exit derivation predicted is a build
    // error, so it must leave a non-zero exit code behind or CI goes green over it.
    it('ERROR: {a failed case} => throws the report, so the exit code is non-zero', async () => {
      const proxy = RunReportLayerResponderProxy();
      proxy.saveSucceeds({ configDir: '/repo', runId: 'r-1784093000000' });

      await expect(
        RunReportLayerResponder({
          configDir: '/repo',
          runs: [RunResultStub({ cases: [CaseResultStub({ status: 'failed', observedPath: ['grade/return@else'] })] })],
          darkSpots: 'warn',
          deadSurface: 'error',
          inputGaps: 'error',
        }),
      ).rejects.toThrow(/FAIL grade/u);
    });
  });

  // The soundness net. A DERIVED case is P4-sound: it asserts only that its arrange reaches the exit
  // derivation PREDICTED, never a returned value, so a derived case always passes and a green run
  // could be a rubber stamp. These two prove it is not: each drives the REAL interpreter over REAL
  // code with a case HAND-CONSTRUCTED to be unreachable, so EXECUTION (not a mock) produces the
  // failure, and the REAL formatter renders it as the exact text `assayer unit` throws to leave a
  // non-zero exit behind.
  //
  // The two cases below are the two outcomes that are NOT a pass, and they must not render alike: the
  // first threw and reports ERROR (look at the arrange), the second came out the wrong exit and reports
  // FAIL (look at the derivation). Both leave a non-zero exit code.
  describe('fails loudly — the P4 soundness net', () => {
    it('ERROR: {a string arranged where the entry maps an array} => the real run FAILS with the throw, and the layer throws that exact report', async () => {
      const proxy = RunReportLayerResponderProxy();
      proxy.saveSucceeds({ configDir: '/repo', runId: 'r-soundness-net' });
      const probe = probeRuntimeCreateBroker();

      const testCase = DerivedTestCaseStub({
        reachesPath: [MAP_EXIT],
        arrange: [{ kind: 'param', param: 'items', value: 'oops' }],
      });
      // Real instrumented code `(items) => items.map(...)`. Arranging a STRING makes `.map` throw
      // inside the instrumented call before any exit fires: the interpreter reports the throw and
      // could not report a pass if it wanted to.
      const result = caseInterpretBroker({
        entry: (items: number[]) => probe.x(MAP_EXIT, items.map((n) => n + 1)),
        entryName: 'mapEach',
        exitIds: [MAP_EXIT],
        testCase,
        probe,
      });

      // ERRORED, not failed: it threw before any exit fired, so no verdict about the predicted exit
      // exists. That distinction is the whole point here: the fault is the ARRANGE (a string where an
      // array belongs), and `failed` would send the reader to the derivation instead.
      expect(result).toStrictEqual({
        entryName: 'mapEach',
        testCase,
        status: 'errored',
        observedPath: [],
        trace: [],
        message: 'threw before reaching an exit: items.map is not a function',
      });

      const runs = [RunResultStub({ runId: 'r-soundness-net', relPath: 'src/wrong-type-arrange.ts', cases: [result] })];
      const report =
        'src/wrong-type-arrange.ts  0/1 passed\n' +
        '  ERROR mapEach("oops")\n' +
        '    threw before reaching an exit: items.map is not a function\n' +
        '  assayer detail r-soundness-net';

      // The real formatter renders the throw verbatim as the ERROR block a reader acts on: the arrange
      // and the message, with no predicted/observed pair the run never produced.
      expect(String(unitReportFormatTransformer({ runs }))).toBe(report);

      await expect(
        RunReportLayerResponder({ configDir: '/repo', runs, darkSpots: 'warn', deadSurface: 'error', inputGaps: 'error' }),
      ).rejects.toThrow(new CliExactOutputError({ message: report }));
    });

    it('ERROR: {an arrange that reaches an exit the case did not predict} => the real run FAILS on the wrong path, and the layer throws that exact report', async () => {
      const proxy = RunReportLayerResponderProxy();
      proxy.saveSucceeds({ configDir: '/repo', runId: 'r-soundness-net' });
      const probe = probeRuntimeCreateBroker();

      const testCase = DerivedTestCaseStub({
        reachesPath: [CLASSIFY_THEN],
        arrange: [{ kind: 'param', param: 'score', value: 0 }],
      });
      // The arrange drives the flow to the ELSE exit, but the case PREDICTED the THEN exit: the
      // observed path's suffix does not equal the predicted path, so the interpreter fails it.
      const result = caseInterpretBroker({
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

      await expect(
        RunReportLayerResponder({ configDir: '/repo', runs, darkSpots: 'warn', deadSurface: 'error', inputGaps: 'error' }),
      ).rejects.toThrow(new CliExactOutputError({ message: report }));
    });
  });

  describe('a run with a dark spot', () => {
    // A dark spot fails the build only when the repo asked (`darkSpots: 'error'`), because it is
    // ASSAYER's debt (syntax it has no handler for), so failing by default would break every build
    // over work the caller cannot do.
    it('ERROR: {a dark spot, darkSpots: error} => throws the report, so the exit code is non-zero', async () => {
      const proxy = RunReportLayerResponderProxy();
      proxy.saveSucceeds({ configDir: '/repo', runId: 'r-1784093000000' });

      await expect(
        RunReportLayerResponder({
          configDir: '/repo',
          runs: [RunResultStub({ darkSpots: [DarkSpotStub()] })],
          darkSpots: 'error',
          deadSurface: 'error',
          inputGaps: 'error',
        }),
      ).rejects.toThrow(/DARK ForStatement/u);
    });

    // The same dark spot under `warn` is REPORTED but does not fail the run: the report names it
    // either way; the severity decides only whether the exit code follows.
    it('VALID: {a dark spot, darkSpots: warn} => reports it without failing the run', async () => {
      const proxy = RunReportLayerResponderProxy();
      proxy.saveSucceeds({ configDir: '/repo', runId: 'r-1784093000000' });

      const result = await RunReportLayerResponder({
        configDir: '/repo',
        runs: [RunResultStub({ darkSpots: [DarkSpotStub()] })],
        darkSpots: 'warn',
        deadSurface: 'error',
        inputGaps: 'error',
      });

      expect(String(result)).toBe(
        'packages/syntax-repository/src/happy-path/boolean/and/and.ts  1/1 passed\n' +
          '  DARK ForStatement at L3-L5 in sumAll — Assayer has no handler for it, so nothing inside it is covered',
      );
    });

    // The third arm, and the sibling that makes the gap/lint ruling below a rule rather than a
    // one-off: `off` suppresses the EXIT CODE and nothing else, so the report is byte-identical to
    // `warn`.
    it('VALID: {a dark spot, darkSpots: off} => still reported, and still does not fail the run', async () => {
      const proxy = RunReportLayerResponderProxy();
      proxy.saveSucceeds({ configDir: '/repo', runId: 'r-1784093000000' });

      const result = await RunReportLayerResponder({
        configDir: '/repo',
        runs: [RunResultStub({ darkSpots: [DarkSpotStub()] })],
        darkSpots: 'off',
        deadSurface: 'error',
        inputGaps: 'error',
      });

      expect(String(result)).toBe(
        'packages/syntax-repository/src/happy-path/boolean/and/and.ts  1/1 passed\n' +
          '  DARK ForStatement at L3-L5 in sumAll — Assayer has no handler for it, so nothing inside it is covered',
      );
    });
  });

  describe('a run with dead surface', () => {
    // A lint fails the build when the repo asked (`deadSurface: 'error'`), because dead code is the
    // repo's debt: the same exit-code path a dark spot takes under its own toggle.
    it('ERROR: {a dead-surface lint, deadSurface: error} => throws the report, so the exit code is non-zero', async () => {
      const proxy = RunReportLayerResponderProxy();
      proxy.saveSucceeds({ configDir: '/repo', runId: 'r-1784093000000' });

      await expect(
        RunReportLayerResponder({
          configDir: '/repo',
          runs: [RunResultStub({ lints: [LintEntryStub()] })],
          darkSpots: 'warn',
          deadSurface: 'error',
          inputGaps: 'error',
        }),
      ).rejects.toThrow(/LINT decide/u);
    });

    // The same lint under `warn` is REPORTED but does not fail the run: the report names it either
    // way; the severity decides only whether the exit code follows.
    it('VALID: {a dead-surface lint, deadSurface: warn} => reports it without failing the run', async () => {
      const proxy = RunReportLayerResponderProxy();
      proxy.saveSucceeds({ configDir: '/repo', runId: 'r-1784093000000' });

      const result = await RunReportLayerResponder({
        configDir: '/repo',
        runs: [RunResultStub({ lints: [LintEntryStub()] })],
        darkSpots: 'warn',
        deadSurface: 'warn',
        inputGaps: 'error',
      });

      expect(String(result)).toBe(
        'packages/syntax-repository/src/happy-path/boolean/and/and.ts  1/1 passed\n' +
          '  LINT decide — nothing in this file calls it, so it is dead surface',
      );
    });

    // `off` suppresses the EXIT CODE and nothing else, so the report is byte-identical to `warn`.
    it('VALID: {a dead-surface lint, deadSurface: off} => still reported, and still does not fail the run', async () => {
      const proxy = RunReportLayerResponderProxy();
      proxy.saveSucceeds({ configDir: '/repo', runId: 'r-1784093000000' });

      const result = await RunReportLayerResponder({
        configDir: '/repo',
        runs: [RunResultStub({ lints: [LintEntryStub()] })],
        darkSpots: 'warn',
        deadSurface: 'off',
        inputGaps: 'error',
      });

      expect(String(result)).toBe(
        'packages/syntax-repository/src/happy-path/boolean/and/and.ts  1/1 passed\n' +
          '  LINT decide — nothing in this file calls it, so it is dead surface',
      );
    });
  });

  describe('a run with a gap', () => {
    // A gap fails the build when the repo asked (`inputGaps: 'error'`, the default), because a gap is
    // the CALLER's debt (an input Assayer cannot construct, or an entry it cannot reach through), and
    // a harness the caller writes closes either.
    it('ERROR: {a gap, inputGaps: error} => throws the report, so the exit code is non-zero', async () => {
      const proxy = RunReportLayerResponderProxy();
      proxy.saveSucceeds({ configDir: '/repo', runId: 'r-1784093000000' });

      await expect(
        RunReportLayerResponder({
          configDir: '/repo',
          runs: [RunResultStub({ gaps: [EntryGapStub()] })],
          darkSpots: 'warn',
          deadSurface: 'error',
          inputGaps: 'error',
        }),
      ).rejects.toThrow(/GAP find/u);
    });

    // The same gap under `warn` is REPORTED but does not fail the run: the report names it either way;
    // the severity decides only whether the exit code follows.
    it('VALID: {a gap, inputGaps: warn} => reports it without failing the run', async () => {
      const proxy = RunReportLayerResponderProxy();
      proxy.saveSucceeds({ configDir: '/repo', runId: 'r-1784093000000' });

      const result = await RunReportLayerResponder({
        configDir: '/repo',
        runs: [RunResultStub({ gaps: [EntryGapStub()] })],
        darkSpots: 'warn',
        deadSurface: 'error',
        inputGaps: 'warn',
      });

      expect(String(result)).toBe(
        'packages/syntax-repository/src/happy-path/boolean/and/and.ts  1/1 passed\n' +
          '  GAP find — its class needs constructor arguments, so no instance can be built to drive it — needs a harness',
      );
    });

    // `off` means "do not fail the build", never "do not say it": no severity changes what the report
    // SAYS, so this must be byte-identical to the `warn` run above. A run that silently dropped the
    // admission would print `1/1 passed` for a file with an unconstructable input.
    it('VALID: {a gap, inputGaps: off} => still reported, and still does not fail the run', async () => {
      const proxy = RunReportLayerResponderProxy();
      proxy.saveSucceeds({ configDir: '/repo', runId: 'r-1784093000000' });

      const result = await RunReportLayerResponder({
        configDir: '/repo',
        runs: [RunResultStub({ gaps: [EntryGapStub()] })],
        darkSpots: 'warn',
        deadSurface: 'error',
        inputGaps: 'off',
      });

      expect(String(result)).toBe(
        'packages/syntax-repository/src/happy-path/boolean/and/and.ts  1/1 passed\n' +
          '  GAP find — its class needs constructor arguments, so no instance can be built to drive it — needs a harness',
      );
    });
  });
});
