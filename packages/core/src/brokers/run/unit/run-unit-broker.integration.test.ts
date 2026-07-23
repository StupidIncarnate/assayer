import { bucketVerdict } from '../../../../test/harnesses/bucket-verdict';
import { runUnitHarness } from '../../../../test/harnesses/run-unit.harness';
import { specimenCatalogue } from '../../../../test/harnesses/specimen-catalogue';

// The colocated unit test mocks EVERYTHING — the proxy hands back a stub run and Jest never executes
// — so it cannot notice the engine breaking. This drives the real thing: real analysis, real probe
// injection, real wrapped Jest, real artifact.
const AND_SPECIMEN = 'packages/syntax-repository/src/happy-path/boolean/and/and.ts';
const CLASS_SPECIMEN = 'packages/syntax-repository/src/happy-path/if-else/in-class/in-class.ts';
// A permanent dead-end: a module scope on a welded const, undriven forever. This check cannot lose
// its subject to someone making a syntax rung drivable.
const MODULE_SPECIMEN = 'packages/syntax-repository/src/sad-path/undriven/welded-const/welded-const.ts';
// A private DRIVEN through its caller, and a private nothing consumes: the two Stage-B/C payoffs that
// only a real run can prove — one that the interpreter judges correctly, one that rides the artifact.
const NESTED_SPECIMEN = 'packages/syntax-repository/src/happy-path/composition/nested-function/nested-function.ts';
const DEAD_SURFACE_SPECIMEN = 'packages/syntax-repository/src/sad-path/dead-surface/dead-surface.ts';
// A module-scope switch driven by the environment: each case writes CODE and re-imports; the default
// is reached with CODE unset (NaN matches no case). Only a real run proves the default's empty arrange
// actually lands there.
const SWITCH_ENV_SPECIMEN = 'packages/syntax-repository/src/happy-path/switch/pure-statement/pure-statement.ts';
// Two imported predicates guarding one value, whose thresholds contradict (`> 50` returns first, so
// `> 100` can never hold). Only a real run proves the cross-file compose overlay reaches the sibling
// definitions, rebases both guards onto `size`, and that the surviving two cases actually execute the
// exits they predict while the dead middle exit rides the artifact as an unreachable-exit lint.
const CROSS_FILE_GUARDS_SPECIMEN = 'packages/syntax-repository/src/sad-path/unreachable/cross-file-guards/cross-file-guards.ts';
// An object-member branch driven by stub-realize, carrying a COMMITTED `mode` correction under
// `smoke-repo/assayer/stubs/`. Only a real run proves the overlay reaches the merged stub view and a
// human-supplied value becomes an arrange a case actually executes.
const BRANCH_LOCAL_SPECIMEN = 'packages/syntax-repository/src/happy-path/object/branch-local/branch-local.ts';

// Every eponymous ROOT on disk paired with the bucket its folder declares — not the handful anyone
// thought to name. Walked rather than written down: a literal list goes stale the moment someone adds
// syntax, and goes stale silently — which is how a whole rung came to have its run untested. Children
// ride their root and are driven separately, only for the artifact floor.
//
// Driving all of them in one process is only affordable because the runner reuses one ts-jest
// compiler across runs; when each run had its own config this file OOM'd at ~4GB.
const ROOTS = specimenCatalogue()
  .roots()
  .map((root) => [String(root.relPath), root.bucket] as const);
const CHILDREN = specimenCatalogue()
  .children()
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

    // The Stage-B payoff, RUN and not merely derived: `inner` is unexported and driven through `outer`
    // by cases that set `outer`'s own input. Every case passing proves the interpreter judges the
    // folded cases correctly — the probe fires at inner's OWN exit, scoped to inner's exit ids — with
    // no change to the interpreter. `outer`'s trivial case plus inner's two arms make three.
    it('VALID: {a private driven through its caller} => every case passes, the inner branch covered through outer', async () => {
      const result = await engine.run({ relPath: NESTED_SPECIMEN, runId: 'r-nested' });

      expect(result.cases.map((testCase) => String(testCase.status))).toStrictEqual(['passed', 'passed', 'passed']);
    });

    // The Stage-C payoff: `greet` is driven and passes, while `unused` — a private nothing consumes —
    // rides the run artifact as a dead-surface lint. The shim writes it beside the cases, so the
    // responder can fail the build on it; a stub run could not carry it.
    it('VALID: {a file with dead surface} => the real case passes AND the lint rides the artifact', async () => {
      const result = await engine.run({ relPath: DEAD_SURFACE_SPECIMEN, runId: 'r-dead' });

      expect({
        cases: result.cases.map((testCase) => String(testCase.status)),
        lints: result.lints.map((lint) => ({ rule: String(lint.rule), name: String(lint.name) })),
      }).toStrictEqual({ cases: ['passed'], lints: [{ rule: 'dead-surface', name: 'unused' }] });
    });

    // A module-scope switch driven by the environment: each case writes CODE and re-imports fresh, the
    // default is reached with CODE unset (Number(undefined) = NaN, matching no case). All three passing
    // proves the switch reads its discriminant's env source and that the default's empty arrange lands.
    it('VALID: {an env-driven module switch} => every case passes, default included', async () => {
      const result = await engine.run({ relPath: SWITCH_ENV_SPECIMEN, runId: 'r-switch-env' });

      expect(result.cases.map((testCase) => String(testCase.status))).toStrictEqual(['passed', 'passed', 'passed']);
    });

    // The cross-file compose payoff, RUN and not merely derived: with both imported guards rebased onto
    // `size`, the FULL input-bucket set is three cases — the two reachable exits get sound values that
    // pass against the real siblings, plus one grayed breadth twin that converges on a reached exit and
    // passes too — while the contradiction between `> 50` and `> 100` leaves the middle exit dead and
    // rides the artifact as an unreachable-exit lint the responder can fail on.
    it('VALID: {two imported guards whose thresholds contradict} => all three cases pass AND the unreachable-exit lint rides the artifact', async () => {
      const result = await engine.run({ relPath: CROSS_FILE_GUARDS_SPECIMEN, runId: 'r-cross-file' });

      expect({
        cases: result.cases.map((testCase) => String(testCase.status)),
        lints: result.lints.map((lint) => ({ rule: String(lint.rule), name: String(lint.name) })),
      }).toStrictEqual({ cases: ['passed', 'passed', 'passed'], lints: [{ rule: 'unreachable-exit', name: 'upload' }] });
    });

    // The stub-repository payoff, RUN and not merely derived: `decide(config)` branches on `config.mode`,
    // and the committed overlay corrects `mode` to the AUTHORITATIVE set `['a','dev','prod','staging']`.
    // Stub-realize arranges the object param from that merged view, so each arm runs with a HUMAN-supplied
    // value — a P4-safe INPUT: the then arm the corrected `a` the guard admits, the else arm the corrected
    // `dev` — and both reach the exit derivation predicted.
    it('VALID: {an object-member branch with a committed mode correction} => both arms pass, each arranging a corrected value', async () => {
      const result = await engine.run({ relPath: BRANCH_LOCAL_SPECIMEN, runId: 'r-branch-local' });

      expect({
        statuses: result.cases.map((testCase) => String(testCase.status)),
        arranges: result.cases.map((testCase) => testCase.testCase.arrange),
      }).toStrictEqual({
        statuses: ['passed', 'passed'],
        arranges: [
          [{ kind: 'object', param: 'config', value: { mode: 'a' } }],
          [{ kind: 'object', param: 'config', value: { mode: 'dev' } }],
        ],
      });
    });
  });

  describe('every eponymous root runs to the verdict its bucket declares', () => {
    const engine = runUnitHarness();

    // THE driver. A root's folder DECLARES its run verdict — happy-path means running it comes out
    // clean (≥1 case, all passed, no admission), sad-path means it does not — and running the real
    // engine and comparing is the run-side twin of the analyzer's declared-vs-observed cross-check.
    // The bucket is authored by a human choosing the folder; the verdict is what the engine did; a
    // specimen that quietly started passing, or quietly broke, disagrees with its own folder and fails
    // here. Passing the verdict also proves the floor a run owes: it left a readable artifact to judge.
    it.each(ROOTS)('VALID: {%s} => runs %s', async (relPath, bucket) => {
      const result = await engine.run({ relPath, runId: `r-${relPath.replace(/[^a-z0-9]/giu, '-')}` });

      expect(bucketVerdict({ result })).toBe(bucket);
    });
  });

  describe('every helper child still produces a readable artifact', () => {
    const engine = runUnitHarness();

    // A child is not judged against a bucket — it rides its root — but running it must still leave a
    // readable artifact, the floor every specimen owes. The artifact IS the interface: the CLI prints
    // from it, the desktop renders from it, so a run that executed and wrote nothing is
    // indistinguishable from no run at all, reported by both surfaces as a raw ENOENT on a cache path.
    it.each(CHILDREN)('VALID: {%s} => a run leaves a readable artifact', async (relPath) => {
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
