import { EntryGapStub } from '@assayer/shared/contracts/entry-gap/entry-gap.stub';
import { RunResultStub } from '@assayer/shared/contracts/run-result/run-result.stub';
import { UndrivenEntryStub } from '@assayer/shared/contracts/undriven-entry/undriven-entry.stub';

import { SpecimenOutcomeStub } from '../../../contracts/specimen-outcome/specimen-outcome.stub';
import { specimenObserveBroker } from './specimen-observe-broker';
import { specimenObserveBrokerProxy } from './specimen-observe-broker.proxy';

const REPO_ROOT = '/repo/smoke-repo';
const REL_PATH = 'packages/syntax-repository/src/if/a/a.ts';
const RUN_ID = 'packages__syntax-repository__src__if__a__a.ts';
const SOURCE =
  'export function grade(score: number): string {\n  if (score > 5) {\n    return "pass";\n  }\n\n  return "fail";\n}\n';

describe('specimenObserveBroker', () => {
  describe('the outcome it returns', () => {
    it('VALID: {a file with one if and a run that evaluated nothing} => one branch driven never, and nothing else', async () => {
      const proxy = specimenObserveBrokerProxy();
      proxy.setupObservedRun({
        repoRoot: REPO_ROOT,
        relPath: REL_PATH,
        source: SOURCE,
        runId: RUN_ID,
        run: RunResultStub({ runId: RUN_ID, relPath: REL_PATH, cases: [] }),
      });

      const outcome = await specimenObserveBroker({ repoRoot: REPO_ROOT, relPath: REL_PATH });

      expect(outcome).toStrictEqual(
        SpecimenOutcomeStub({ branches: [{ kind: 'if', line: 2, driven: 'never' }] }),
      );
    });

    it('VALID: {a run that reports a gap and an undriven admission} => both appear in the outcome', async () => {
      const proxy = specimenObserveBrokerProxy();
      proxy.setupObservedRun({
        repoRoot: REPO_ROOT,
        relPath: REL_PATH,
        source: SOURCE,
        runId: RUN_ID,
        run: RunResultStub({
          runId: RUN_ID,
          relPath: REL_PATH,
          cases: [],
          gaps: [EntryGapStub({ name: 'score' })],
          undriven: [UndrivenEntryStub({ startLine: 1 })],
        }),
      });

      const outcome = await specimenObserveBroker({ repoRoot: REPO_ROOT, relPath: REL_PATH });

      expect(outcome).toStrictEqual(
        SpecimenOutcomeStub({
          branches: [{ kind: 'if', line: 2, driven: 'never' }],
          gaps: [{ name: 'score' }],
          undriven: [{ startLine: 1 }],
        }),
      );
    });
  });

  describe('how it runs Assayer', () => {
    it('VALID: {a relative path} => empties and recreates the per-process cache folder, once each', async () => {
      const proxy = specimenObserveBrokerProxy();
      proxy.setupObservedRun({
        repoRoot: REPO_ROOT,
        relPath: REL_PATH,
        source: SOURCE,
        runId: RUN_ID,
        run: RunResultStub({ runId: RUN_ID, relPath: REL_PATH, cases: [] }),
      });

      await specimenObserveBroker({ repoRoot: REPO_ROOT, relPath: REL_PATH });

      expect(proxy.cacheDirCalls()).toStrictEqual({
        removed: [[proxy.cacheDir(), { recursive: true, force: true }]],
        created: [[proxy.cacheDir(), { recursive: true }]],
      });
    });

    it('VALID: {a relative path} => the run writes under the cache folder, in a run folder named by the path with slashes as double underscores', async () => {
      const proxy = specimenObserveBrokerProxy();
      proxy.setupObservedRun({
        repoRoot: REPO_ROOT,
        relPath: REL_PATH,
        source: SOURCE,
        runId: RUN_ID,
        run: RunResultStub({ runId: RUN_ID, relPath: REL_PATH, cases: [] }),
      });

      await specimenObserveBroker({ repoRoot: REPO_ROOT, relPath: REL_PATH });

      expect(proxy.writtenPaths().slice(0, 1)).toStrictEqual([
        `${proxy.cacheDir()}/runs/${RUN_ID}/cases.json`,
      ]);
    });

    it("VALID: {a relative path} => the generated test loads core's run-time modules from the core package beside this one", async () => {
      const proxy = specimenObserveBrokerProxy();
      proxy.setupObservedRun({
        repoRoot: REPO_ROOT,
        relPath: REL_PATH,
        source: SOURCE,
        runId: RUN_ID,
        run: RunResultStub({ runId: RUN_ID, relPath: REL_PATH, cases: [] }),
      });

      await specimenObserveBroker({ repoRoot: REPO_ROOT, relPath: REL_PATH });

      expect(proxy.writtenShim().split('\n').at(2)).toMatch(
        /^const \{ caseInterpretBroker \} = require\("\/.+\/packages\/core\/src\/brokers\/case\/interpret\/case-interpret-broker"\);$/u,
      );
    });
  });

  describe('a file that cannot be read', () => {
    it('ERROR: {the specimen is not on disk} => rejects with the raw ENOENT error', async () => {
      const proxy = specimenObserveBrokerProxy();
      proxy.setupMissingSource({ repoRoot: REPO_ROOT, relPath: REL_PATH });

      await expect(specimenObserveBroker({ repoRoot: REPO_ROOT, relPath: REL_PATH })).rejects.toThrow(
        /^ENOENT: open '\/repo\/smoke-repo\/packages\/syntax-repository\/src\/if\/a\/a\.ts'$/u,
      );
    });
  });
});
