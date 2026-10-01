/**
 * PURPOSE: Drives `runFindBroker` and `runConsoleFindBroker` — the two "has this been run" readers the
 *   desktop's boot responder calls — over a REAL cache dir and a REAL colocated harness file, deriving
 *   every lookup id through the real `runIdBroker` rather than a mocked stand-in.
 *
 *   `seed` writes the source, an optional colocated harness, and a saved run + console report keyed by
 *   whatever id the CURRENT bytes produce — exactly what a real run leaves behind
 *   (`runs/<runId>/run.json` + `runs/<runId>/console.txt`, `run-console-save-broker`'s own layout).
 *   `editHarness` then overwrites ONLY the harness file, the one edit neither the source's own content
 *   hash nor its path can see, so the id a fresh lookup computes moves out from under the run `seed`
 *   wrote. Proving "the stale run goes missing" needs exactly this: a unit test that replaces the
 *   loader broker can show the id MOVES, never that a real directory keyed by the old id is correctly
 *   left unfound.
 *
 *   Owns all node:fs / node:os / node:path and removes its temp dir after each test (auto-wired by the
 *   harness transformer).
 *
 * USAGE:
 * const readers = runFindHarness();
 * const { configDir, relPath } = await readers.seed({ harness: HARNESS });
 * await readers.findRun({ configDir, relPath });        // => the RunResult just seeded
 * readers.editHarness({ configDir, harness: EDITED_HARNESS });
 * await readers.findRun({ configDir, relPath });        // => undefined, the id moved
 */
import { mkdtempSync, ensureDirSync, writeFileSync, realpathSync, rmSync } from '#gateway/node/fs';
import { tmpdir } from '#gateway/node/os';
import { join } from '#gateway/node/path';

import { RunResultStub } from '@assayer/shared/contracts/run-result/run-result.stub';
import type { RunResult } from '@assayer/shared/contracts';

import { runConsoleFindBroker } from '../../src/brokers/run/console-find/run-console-find-broker';
import { runFindBroker } from '../../src/brokers/run/find/run-find-broker';
import { runIdBroker } from '../../src/brokers/run/id/run-id-broker';

const SOURCE_REL = 'src/audit.ts';
const HARNESS_REL = 'src/audit.harness.ts';

export const AUDIT_SOURCE = "export const audit = (size: number): string => (size > 3 ? 'big' : 'small');\n";

export const runFindHarness = (): {
  afterEach: () => void;
  seed: (params: {
    harness?: string;
  }) => Promise<{ configDir: string; relPath: string; runId: RunResult['runId'] }>;
  editHarness: (params: { configDir: string; harness: string }) => void;
  findRun: (params: { configDir: string; relPath: string }) => Promise<RunResult | undefined>;
  findConsole: (params: { configDir: string; relPath: string }) => Promise<string | undefined>;
} => {
  const dirs: string[] = [];

  return {
    afterEach: (): void => {
      dirs.forEach((dir) => { rmSync(dir, { recursive: true, force: true }); });
      dirs.length = 0;
    },

    // Writes the source, an optional colocated harness, and the run+console artifacts a real run of
    // THESE bytes would have left — keyed by the id the real `runIdBroker` computes right now, exactly
    // as `run-each-layer-broker` names the directory it writes.
    seed: async ({
      harness,
    }: {
      harness?: string;
    }): Promise<{ configDir: string; relPath: string; runId: RunResult['runId'] }> => {
      const configDir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-run-find-')));
      dirs.push(configDir);
      ensureDirSync(join(configDir, 'src'));
      writeFileSync(join(configDir, SOURCE_REL), AUDIT_SOURCE);

      if (harness !== undefined) {
        writeFileSync(join(configDir, HARNESS_REL), harness);
      }

      const runId = await runIdBroker({ root: configDir, relPath: SOURCE_REL, source: AUDIT_SOURCE });
      const runDir = join(configDir, '.assayer', 'cache', 'runs', String(runId));
      ensureDirSync(runDir);
      writeFileSync(
        join(runDir, 'run.json'),
        JSON.stringify(RunResultStub({ runId, relPath: SOURCE_REL })),
      );
      writeFileSync(join(runDir, 'console.txt'), (`${SOURCE_REL}  1/1 passed\n`));

      return { configDir, relPath: SOURCE_REL, runId };
    },

    editHarness: ({ configDir, harness }: { configDir: string; harness: string }): void => {
      writeFileSync(join(configDir, HARNESS_REL), harness);
    },

    findRun: async ({ configDir, relPath }: { configDir: string; relPath: string }): Promise<RunResult | undefined> =>
      runFindBroker({ configDir, root: configDir, relPath }),

    findConsole: async ({ configDir, relPath }: { configDir: string; relPath: string }): Promise<string | undefined> =>
      runConsoleFindBroker({ configDir, root: configDir, relPath }),
  };
};
