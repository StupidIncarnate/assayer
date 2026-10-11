/**
 * PURPOSE: Compiles the manual-smoke-repo syntax-repository into ONE shared, stable cache dir that every
 *   manual-smoke-repo e2e reuses, plus the per-test reset of that cache's mutable state. The compile is
 *   deterministic — the same source yields byte-identical `.assayer` output — so a single compile
 *   serves the whole suite: the e2e fixture launches ONE Electron process against this dir and reloads
 *   the renderer per test instead of paying a fresh ~10s CLI compile and ~8s cold launch each time.
 *
 *   Saved runs are the sole per-test cache mutation, and a
 *   run is a whole DIRECTORY under `.assayer/cache/runs/` — its verdicts and the report the CLI wrote
 *   beside them. `resetSmokeCache` purges that tree, so every file reads "not run" again AND shows no
 *   run console, without invalidating the compiled surface.
 *
 *   The dir is a STABLE path wiped-and-rebuilt once per run, never minted per test: a fresh temp dir
 *   per test is exactly what made every compile cold, and — for the wrapped runner — strands a ts-jest
 *   compiler per path. Node builtins only (no `@playwright/test`), so Playwright's globalSetup can call
 *   `compileSmokeCache` before any worker starts.
 *
 * USAGE:
 * // globalSetup, after `npm run build`:
 * await compileSmokeCache();
 * // per test (the e2e fixture does this before reloading the warm window):
 * resetSmokeCache();
 */
import { join } from '#gateway/node/path';
import { tmpdir } from '#gateway/node/os';
import { ensureDirSync, writeFileSync, rmSync } from '#gateway/node/fs';
import { spawn } from '#gateway/node/child_process';
import { execPath } from '#gateway/node/process';

const cliEntry = join(__dirname, '..', '..', '..', 'cli', 'dist', 'bin', 'assayer.js');
const smokeRepoPath = join(__dirname, '..', '..', '..', '..', 'manual-smoke-repo');

// The absolute path to the BUILT Electron main entry — the same binary a production launch runs.
export const desktopMainEntry = join(__dirname, '..', '..', '..', 'desktop', 'dist', 'bin', 'desktop-main.js');

// One shared cache dir for the whole run. basename is `assayer` so the manifest's repoName reads
// `assayer` — the value the surface header asserts. The parent is the wipe target between runs.
const smokeCacheParent = join(tmpdir(), 'assayer-e2e-smoke-cache');
export const smokeCacheConfigDir = join(smokeCacheParent, 'assayer');
const smokeConfigPath = join(smokeCacheConfigDir, 'assayer.config.json');
const smokeRunsDir = join(smokeCacheConfigDir, '.assayer', 'cache', 'runs');

// The minimal config a single per-test compile used to write and restore.
const writeConfig = (): void => {
  writeFileSync(
    smokeConfigPath,
    JSON.stringify({
      repoRoot: smokeRepoPath,
      exclude: [],
      stableBranch: 'master',
    }),
  );
};

export const compileSmokeCache = async (): Promise<void> => {
  rmSync(smokeCacheParent, { recursive: true, force: true });
  ensureDirSync(smokeCacheConfigDir);
  writeConfig();

  await new Promise<void>((resolve, reject) => {
    const child = spawn(execPath, [cliEntry, 'status'], { cwd: smokeCacheConfigDir, stdio: 'ignore' });
    child.on('error', reject);
    child.on('close', (code, signal) => {
      // The precheck mutates the config in place (fills schema defaults); rewrite the minimal form so the
      // desktop reads exactly what a single per-test compile used to leave behind.
      writeConfig();
      if (code === null) {
        reject(
          new Error(
            `assayer: the manual-smoke-repo compile was killed by ${String(signal)} before writing a cache manifest, so the e2e suite has no compiled surface to read. Re-run it; if the kill repeats, run \`node ${cliEntry} status\` in a temp config dir pointed at ${smokeRepoPath}.`,
          ),
        );
        return;
      }
      if (code !== 0) {
        reject(
          new Error(
            `assayer: the manual-smoke-repo precheck exited ${code}, so the e2e suite has no compiled surface. Run \`node ${cliEntry} status\` in a temp config dir pointed at ${smokeRepoPath} to see why.`,
          ),
        );
        return;
      }
      resolve();
    });
  });
};

// Reset the shared cache's per-test mutable state: purge saved runs — verdicts and saved reports alike,
// since both live in the run's own directory. Never touches the compiled blobs, so no recompile is
// needed.
export const resetSmokeCache = (): void => {
  rmSync(smokeRunsDir, { recursive: true, force: true });
  writeConfig();
};
