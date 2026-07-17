import { runUnitHarness } from '../../../../test/harnesses/run-unit.harness';
import { specimenCatalogue } from '../../../../test/harnesses/specimen-catalogue';

// The colocated unit test mocks EVERYTHING — the proxy hands back a stub run and Jest never executes
// — so it cannot notice the engine breaking. This drives the real thing: real analysis, real probe
// injection, real wrapped Jest, real artifact.
const AND_SPECIMEN = 'packages/syntax-repository/src/boolean/and.ts';
const CLASS_SPECIMEN = 'packages/syntax-repository/src/if-else/in-class.ts';
// The specimen that exists FOR the undriven admission, so this check cannot lose its subject to
// someone making a syntax rung drivable.
const MODULE_SPECIMEN = 'packages/syntax-repository/src/undriven/welded-operand.ts';

// Every specimen on disk, not the two anyone thought to name. Walked rather than written down: a
// literal list goes stale the moment someone adds syntax, and goes stale silently — which is how a
// whole rung came to have its run untested.
//
// Driving all of them in one process is only affordable because the runner reuses one ts-jest
// compiler across runs; when each run had its own config this file OOM'd at ~4GB.
const ALL_SPECIMENS = specimenCatalogue()
  .relPaths()
  .map((relPath) => String(relPath));

describe('runUnitBroker (integration)', () => {
  describe('a real run against a real specimen', () => {
    const engine = runUnitHarness();

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

    // Its `if` is real, its two derived cases both arrange NOTHING — the operand is a const welded to
    // a literal — so at most one could ever execute and driving them would fail a case against
    // correct code. The honest run drives neither and says why: an artifact of `cases: []` alone is
    // what a fully covered file leaves behind.
    it('VALID: {a module-scope specimen} => zero cases, and the undriven logic named rather than implied', async () => {
      const result = await engine.run({ relPath: MODULE_SPECIMEN, runId: 'r-module' });

      expect({
        cases: result.cases,
        gaps: result.gaps,
        darkSpots: result.darkSpots,
        undriven: result.undriven.map((entry) => String(entry.name)),
      }).toStrictEqual({ cases: [], gaps: [], darkSpots: [], undriven: ['*module*'] });
    });
  });

  describe('every specimen in the catalogue produces an artifact', () => {
    const engine = runUnitHarness();

    // THE floor, and a specimen pays nothing to get it: whatever a file contains, running it must
    // leave a readable artifact behind. The artifact IS the interface — the CLI prints from it, the
    // desktop renders from it — so a run that executed and wrote nothing is indistinguishable from
    // no run at all, and both surfaces can only report it as a raw ENOENT on a cache path.
    it.each(ALL_SPECIMENS)('VALID: {%s} => a run leaves a readable artifact', async (relPath) => {
      const result = await engine.run({ relPath, runId: `r-${relPath.replace(/[^a-z0-9]/giu, '-')}` });

      expect(String(result.relPath)).toBe(relPath);
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
