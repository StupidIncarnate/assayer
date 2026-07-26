import { RunResultStub } from '@assayer/shared/contracts';

import { runFindHarness } from '../../../../test/harnesses/run-find.harness';

const HARNESS =
  "import { assayerHarness } from '@assayer/core';\nassayerHarness({ inputs: { audit: { report: () => () => undefined } } });\n";
const EDITED_HARNESS =
  "import { assayerHarness } from '@assayer/core';\nassayerHarness({ inputs: { audit: { report: () => () => 1 } } });\n";

// The colocated unit test replaces `runLoadBroker` wholesale, so it can prove the id an edited harness
// produces MOVES but never that a stale `run.json` sitting on a REAL disk is actually left unfound
// through this reader — the one the desktop's boot responder calls. This drives the real thing: a real
// cache dir, a real colocated harness file, and the real `runIdBroker` doing the lookup, never a mock.
describe('runFindBroker (integration)', () => {
  describe('a saved run, looked up over a real cache dir', () => {
    const readers = runFindHarness();

    it('VALID: {harness untouched} => the saved run is found', async () => {
      const seeded = await readers.seed({ harness: HARNESS });

      const result = await readers.findRun({ configDir: seeded.configDir, relPath: seeded.relPath });

      expect(result).toStrictEqual(RunResultStub({ runId: seeded.runId, relPath: seeded.relPath }));
    });

    // The harness hash is the ONLY run-id ingredient that moves on this edit: the source's own bytes and
    // its path are both untouched. A run saved under the OLD id must not go on answering for a harness
    // that no longer supplies what it did when that run happened.
    it('EMPTY: {the colocated harness edited, source untouched} => the stale run is no longer found', async () => {
      const seeded = await readers.seed({ harness: HARNESS });
      readers.editHarness({ configDir: seeded.configDir, harness: EDITED_HARNESS });

      const result = await readers.findRun({ configDir: seeded.configDir, relPath: seeded.relPath });

      expect(result).toBe(undefined);
    });
  });
});

// The report twin, sharing the identical id and the identical vulnerability: `runConsoleFindBroker`
// derives its lookup through the SAME `runIdBroker` and reads from the SAME run directory `runFindBroker`
// does. One shared harness proves the shape for both readers rather than a near-copy file re-deriving the
// same real cache dir a second time.
describe('runConsoleFindBroker (integration)', () => {
  describe('a saved console report, looked up over a real cache dir', () => {
    const readers = runFindHarness();

    it('VALID: {harness untouched} => the saved report is found', async () => {
      const seeded = await readers.seed({ harness: HARNESS });

      const result = await readers.findConsole({ configDir: seeded.configDir, relPath: seeded.relPath });

      expect(String(result)).toBe(`${String(seeded.relPath)}  1/1 passed\n`);
    });

    it('EMPTY: {the colocated harness edited, source untouched} => the stale report is no longer found', async () => {
      const seeded = await readers.seed({ harness: HARNESS });
      readers.editHarness({ configDir: seeded.configDir, harness: EDITED_HARNESS });

      const result = await readers.findConsole({ configDir: seeded.configDir, relPath: seeded.relPath });

      expect(result).toBe(undefined);
    });
  });
});
