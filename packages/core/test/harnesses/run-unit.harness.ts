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
 *   Requires `npm run build` — the generated shim requires core's BUILT adapters by absolute path.
 *   Same precondition the CLI's own integration harness and the app e2e already carry.
 *
 * USAGE:
 * const engine = runUnitHarness();
 * // beforeEach makes a fresh temp cache dir; afterEach removes it (auto-wired by the harness transformer)
 * const result = await engine.run({ relPath: 'packages/syntax-repository/src/boolean/and.ts', runId: 'r1' });
 * engine.savedRun({ runId: 'r1' }); // => the RunResult parsed back off disk
 */
import { mkdtempSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { runResultContract } from '@assayer/shared/contracts';
import type { RunResult } from '@assayer/shared/contracts';

import { runUnitBroker } from '../../src/brokers/run/unit/run-unit-broker';

const CORE_ROOT = resolve(__dirname, '..', '..');
const SMOKE_REPO = resolve(CORE_ROOT, '..', '..', 'smoke-repo');

export const runUnitHarness = (): {
  beforeEach: () => void;
  afterEach: () => void;
  distBuilt: () => boolean;
  run: ({ relPath, runId }: { relPath: string; runId: string }) => Promise<RunResult>;
  savedRun: ({ runId }: { runId: string }) => RunResult;
} => {
  let cacheDir = '';

  return {
    beforeEach: (): void => {
      cacheDir = mkdtempSync(join(tmpdir(), 'assayer-engine-'));
    },
    afterEach: (): void => {
      rmSync(cacheDir, { recursive: true, force: true });
    },
    distBuilt: (): boolean => existsSync(join(CORE_ROOT, 'dist', 'adapters.js')),
    run: async ({ relPath, runId }: { relPath: string; runId: string }): Promise<RunResult> => {
      const absPath = join(SMOKE_REPO, relPath);

      return runUnitBroker({
        cacheDir,
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
      runResultContract.parse(JSON.parse(readFileSync(join(cacheDir, 'runs', runId, 'run.json'), 'utf8'))),
  };
};
