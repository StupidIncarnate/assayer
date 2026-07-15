import { runUnitHarness } from '../../../../test/harnesses/run-unit.harness';

// The colocated unit test mocks EVERYTHING — the proxy hands back a stub run and Jest never executes
// — so it cannot notice the engine breaking. This drives the real thing: real analysis, real probe
// injection, real wrapped Jest, real artifact.
const AND_SPECIMEN = 'packages/syntax-repository/src/boolean/and.ts';
const CLASS_SPECIMEN = 'packages/syntax-repository/src/if-else/in-class.ts';

describe('runUnitBroker (integration)', () => {
  describe('a real run against a real specimen', () => {
    const engine = runUnitHarness();

    it('VALID: {the built adapters} => exist, since the shim requires them by absolute path', () => {
      expect(engine.distBuilt()).toBe(true);
    });

    it('VALID: {an && specimen} => every derived case reaches the exit derivation predicted', async () => {
      const result = await engine.run({ relPath: AND_SPECIMEN, runId: 'r-and' });

      expect(result.cases.map((testCase) => String(testCase.status))).toStrictEqual(['passed', 'passed', 'passed']);
    });

    // A method is reached through an INSTANCE. Driving it as a module property found nothing and
    // reported correct code as failing, so this rung earns a real run rather than a stub.
    it('VALID: {a class method} => is constructed and driven, not reported as missing', async () => {
      const result = await engine.run({ relPath: CLASS_SPECIMEN, runId: 'r-class' });

      expect(result.cases.map((testCase) => String(testCase.status))).toStrictEqual(['passed', 'passed']);
    });
  });

  describe('the artifact it leaves behind', () => {
    const engine = runUnitHarness();

    // The artifact IS the interface — the CLI and the desktop both read it rather than watching the
    // runner. A run that executed but wrote nothing is indistinguishable from no run at all.
    it('VALID: {a completed run} => the artifact on disk carries the same run', async () => {
      await engine.run({ relPath: AND_SPECIMEN, runId: 'r-artifact' });

      const saved = engine.savedRun({ runId: 'r-artifact' });

      expect({ runId: String(saved.runId), relPath: String(saved.relPath), count: saved.cases.length }).toStrictEqual({
        runId: 'r-artifact',
        relPath: AND_SPECIMEN,
        count: 3,
      });
    });

    it('VALID: {a completed run} => the saved verdicts match what the broker returned', async () => {
      const returned = await engine.run({ relPath: AND_SPECIMEN, runId: 'r-same' });

      const saved = engine.savedRun({ runId: 'r-same' });

      expect(saved.cases.map((testCase) => String(testCase.status))).toStrictEqual(
        returned.cases.map((testCase) => String(testCase.status)),
      );
    });
  });
});
