/**
 * PURPOSE: Launches the REAL built Electron desktop app (desktop/dist/bin/desktop-main.js) against a
 *   freshly-created temp config dir that has NO .assayer directory at all — the true first-run / dev
 *   condition where `npm run dev` launches the app but never runs the CLI compile, so no cache
 *   manifest was ever written. Distinct from emptySurfaceAppHarness, which SEEDS a manifest listing
 *   zero files: here there is no manifest file to read. Drives the Compiled Surface Explorer's
 *   missing-manifest path to its empty-state terminal (obs-empty-state) WITHOUT the desktop main
 *   throwing ENOENT. Exposes the window as a Playwright Page and owns teardown via afterEach (closes
 *   the app AND removes the temp dir). Requires `npm run build` and a display.
 *
 * USAGE:
 * const noCacheApp = noCacheAppHarness();
 * wireHarnessLifecycle({ harness: noCacheApp });
 * const window = await noCacheApp.launch();
 * // window.getByTestId('SURFACE_EMPTY') renders 'No compiled surface — run assayer'
 */
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtempSync, rmSync } from 'node:fs';
import { _electron } from '@playwright/test';
import type { ElectronApplication, Page } from '@playwright/test';

const desktopMainEntry = join(__dirname, '..', '..', '..', 'desktop', 'dist', 'bin', 'desktop-main.js');

export const noCacheAppHarness = (): {
  afterEach: () => Promise<void>;
  launch: () => Promise<Page>;
} => {
  const running: ElectronApplication[] = [];
  const cleanups: (() => void)[] = [];

  return {
    afterEach: async (): Promise<void> => {
      await Promise.all(running.splice(0).map(async (runningApp) => runningApp.close()));
      cleanups.splice(0).forEach((cleanup) => { cleanup(); });
    },
    launch: async (): Promise<Page> => {
      const configDir = mkdtempSync(join(tmpdir(), 'assayer-no-cache-'));
      cleanups.push(() => { rmSync(configDir, { recursive: true, force: true }); });

      const launched = await _electron.launch({ args: [desktopMainEntry, '--repo', configDir] });
      running.push(launched);

      return launched.firstWindow();
    },
  };
};
