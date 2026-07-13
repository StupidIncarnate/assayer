/**
 * PURPOSE: Launches the REAL built Electron desktop app (desktop/dist/bin/desktop-main.js) against a
 *   freshly-seeded temp config dir whose .assayer/cache/manifest.json lists a single working-tree
 *   namespace with ZERO files — driving the Compiled Surface Explorer's cache-present [no files]
 *   branch to its empty-state terminal. Builds the manifest from the shared AssayerCacheManifestStub
 *   (valid contract shape), exposes the window as a Playwright Page, and owns teardown via afterEach
 *   (closes the app AND removes the temp dir). Requires `npm run build` and a display.
 *
 * USAGE:
 * const emptyApp = emptySurfaceAppHarness();
 * wireHarnessLifecycle({ harness: emptyApp });
 * const window = await emptyApp.launch();
 * // window.getByTestId('SURFACE_EMPTY') renders 'No compiled surface — run assayer'
 */
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { _electron } from '@playwright/test';
import type { ElectronApplication, Page } from '@playwright/test';
import { AssayerCacheManifestStub } from '@assayer/shared/contracts';

const desktopMainEntry = join(__dirname, '..', '..', '..', 'desktop', 'dist', 'bin', 'desktop-main.js');

export const emptySurfaceAppHarness = (): {
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
      const configDir = mkdtempSync(join(tmpdir(), 'assayer-empty-surface-'));
      cleanups.push(() => { rmSync(configDir, { recursive: true, force: true }); });
      mkdirSync(join(configDir, '.assayer', 'cache'), { recursive: true });
      const manifest = AssayerCacheManifestStub({ namespaces: { master: { files: [] } } });
      writeFileSync(join(configDir, '.assayer', 'cache', 'manifest.json'), JSON.stringify(manifest));

      const launched = await _electron.launch({ args: [desktopMainEntry, '--repo', configDir] });
      running.push(launched);

      return launched.firstWindow();
    },
  };
};
