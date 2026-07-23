/**
 * PURPOSE: Compiles the smoke-repo syntax-repository into ONE shared, stable cache dir that every
 *   smoke-repo e2e reuses, plus the per-test reset of that cache's mutable state. The compile is
 *   deterministic — the same source yields byte-identical `.assayer` output — so a single compile
 *   serves the whole suite: the e2e fixture launches ONE Electron process against this dir and reloads
 *   the renderer per test instead of paying a fresh ~10s CLI compile and ~8s cold launch each time.
 *
 *   `runMode` is display-only (excluded from the cache + manifest hash) and is re-read from the config
 *   on every `assayer:status` IPC call, so a test that needs the `intelligent` gray-out just rewrites
 *   the config field and reloads — no recompile. Saved runs (written under `.assayer/cache/runs/` when
 *   a test clicks Run) are the sole per-test cache mutation; `resetSmokeCache` purges them so every
 *   file reads "not run" again, without invalidating the compiled surface.
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
 * resetSmokeCache({ runMode: 'thorough' });
 */
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';

const cliEntry = join(__dirname, '..', '..', '..', 'cli', 'dist', 'bin', 'assayer.js');
const smokeRepoPath = join(__dirname, '..', '..', '..', '..', 'smoke-repo');

// The absolute path to the BUILT Electron main entry — the same binary a production launch runs.
export const desktopMainEntry = join(__dirname, '..', '..', '..', 'desktop', 'dist', 'bin', 'desktop-main.js');

// One shared cache dir for the whole run. basename is `assayer` so the manifest's repoName reads
// `assayer` — the value the surface header asserts. The parent is the wipe target between runs.
const smokeCacheParent = join(tmpdir(), 'assayer-e2e-smoke-cache');
export const smokeCacheConfigDir = join(smokeCacheParent, 'assayer');
const smokeConfigPath = join(smokeCacheConfigDir, 'assayer.config.json');
const smokeRunsDir = join(smokeCacheConfigDir, '.assayer', 'cache', 'runs');

// The minimal config a single per-test compile used to write and restore. `runMode` is display-only, so
// including it changes neither the cache nor the manifest — only which cases the panel grays.
const writeConfig = ({ runMode }: { runMode: 'thorough' | 'intelligent' }): void => {
  writeFileSync(
    smokeConfigPath,
    JSON.stringify({
      repoRoot: smokeRepoPath,
      exclude: [],
      stableBranch: 'master',
      ...(runMode === 'intelligent' ? { runMode: 'intelligent' } : {}),
    }),
  );
};

export const compileSmokeCache = async (): Promise<void> => {
  rmSync(smokeCacheParent, { recursive: true, force: true });
  mkdirSync(smokeCacheConfigDir, { recursive: true });
  writeConfig({ runMode: 'thorough' });

  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, [cliEntry, 'status'], { cwd: smokeCacheConfigDir, stdio: 'ignore' });
    child.on('error', reject);
    child.on('close', (code, signal) => {
      // The precheck mutates the config in place (fills schema defaults); rewrite the minimal form so the
      // desktop reads exactly what a single per-test compile used to leave behind.
      writeConfig({ runMode: 'thorough' });
      if (code === null) {
        reject(
          new Error(
            `assayer: the smoke-repo compile was killed by ${String(signal)} before writing a cache manifest, so the e2e suite has no compiled surface to read. Re-run it; if the kill repeats, run \`node ${cliEntry} status\` in a temp config dir pointed at ${smokeRepoPath}.`,
          ),
        );
        return;
      }
      if (code !== 0) {
        reject(
          new Error(
            `assayer: the smoke-repo precheck exited ${code}, so the e2e suite has no compiled surface. Run \`node ${cliEntry} status\` in a temp config dir pointed at ${smokeRepoPath} to see why.`,
          ),
        );
        return;
      }
      resolve();
    });
  });
};

// Reset the shared cache's per-test mutable state: purge saved runs (so every file reads "not run") and
// set the display-only runMode. Never touches the compiled blobs, so no recompile is needed.
export const resetSmokeCache = ({ runMode }: { runMode: 'thorough' | 'intelligent' }): void => {
  rmSync(smokeRunsDir, { recursive: true, force: true });
  writeConfig({ runMode });
};
