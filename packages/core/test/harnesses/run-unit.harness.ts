/**
 * PURPOSE: Drives the REAL execution engine — analyze, assemble, wrapped Jest, saved artifact —
 *   against a REAL specimen in smoke-repo, from a fresh temp cache dir per test. Owns all node:fs /
 *   node:os / node:path access so a colocated .integration.test.ts asserts on what actually ran and
 *   what actually landed on disk without touching builtins itself.
 *
 *   It reads the artifact back off disk rather than trusting the broker's return value: the artifact
 *   IS the interface both the CLI and the desktop consume, so "the run happened" and "the run is
 *   readable" are different claims and a test that only checks the former proves less than it looks.
 *
 *   The cache dir is EMPTIED between tests, never renamed. Isolation wants a clean directory; it does
 *   not want a different one. Its path reaches the runner's Jest config, and ts-jest keeps one
 *   TypeScript compiler per distinct config forever — so a fresh `mkdtemp` per test made every test
 *   look like a new project and stranded a whole compiler each time, which OOM'd this file at ~4GB
 *   once it drove the whole catalogue. Same path, wiped: same config, one compiler, flat memory.
 *   The pid keeps it unique across parallel Jest workers.
 *
 * USAGE:
 * const engine = runUnitHarness();
 * // beforeEach empties the temp cache dir; afterEach removes it (auto-wired by the harness transformer)
 * const result = await engine.run({ relPath: 'packages/syntax-repository/src/happy-path/boolean/and/and.ts', runId: 'r1' });
 * engine.savedRun({ runId: 'r1' }); // => the RunResult parsed back off disk
 */
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { runResultContract } from '@assayer/shared/contracts';
import type { RunResult } from '@assayer/shared/contracts';

import { runUnitBroker } from '../../src/brokers/run/unit/run-unit-broker';

const CORE_ROOT = resolve(__dirname, '..', '..');
const SMOKE_REPO = resolve(CORE_ROOT, '..', '..', 'smoke-repo');
// Stable for the whole worker, unique across parallel ones — see the note above on why the path must
// not change between tests.
const CACHE_DIR = join(tmpdir(), `assayer-engine-${String(process.pid)}`);

export const runUnitHarness = (): {
  beforeEach: () => void;
  afterEach: () => void;
  run: ({ relPath, runId }: { relPath: string; runId: string }) => Promise<RunResult>;
  savedRun: ({ runId }: { runId: string }) => RunResult;
} => {
  return {
    beforeEach: (): void => {
      rmSync(CACHE_DIR, { recursive: true, force: true });
      mkdirSync(CACHE_DIR, { recursive: true });
    },
    afterEach: (): void => {
      rmSync(CACHE_DIR, { recursive: true, force: true });
    },
    run: async ({ relPath, runId }: { relPath: string; runId: string }): Promise<RunResult> => {
      const absPath = join(SMOKE_REPO, relPath);

      return runUnitBroker({
        cacheDir: CACHE_DIR,
        coreRoot: CORE_ROOT,
        repoRoot: SMOKE_REPO,
        relPath,
        absPath,
        source: readFileSync(absPath, 'utf8'),
        runId,
        analyzerContentHash: 'harness-pinned-hash',
      });
    },
    savedRun: ({ runId }: { runId: string }): RunResult =>
      runResultContract.parse(JSON.parse(readFileSync(join(CACHE_DIR, 'runs', runId, 'run.json'), 'utf8'))),
  };
};
