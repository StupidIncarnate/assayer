/**
 * PURPOSE: Launches the REAL built Electron desktop app (desktop/dist/bin/desktop-main.js) against
 *   the monorepo as its target repo, and exposes its first BrowserWindow as a Playwright Page.
 *   Owns teardown via afterEach so specs stay hook-free. Requires `npm run build` and a display.
 *
 * USAGE:
 * const app = electronAppHarness();
 * wireHarnessLifecycle({ harness: app });
 * const window = await app.launch();
 * // window.getByTestId('STATUS_PANEL') ...
 */
import { join } from 'node:path';
import { _electron } from '@playwright/test';
import type { ElectronApplication, Page } from '@playwright/test';

const desktopMainEntry = join(__dirname, '..', '..', '..', 'desktop', 'dist', 'bin', 'desktop-main.js');
const targetRepoPath = join(__dirname, '..', '..', '..', '..');

export const electronAppHarness = (): {
  afterEach: () => Promise<void>;
  launch: () => Promise<Page>;
} => {
  const running: ElectronApplication[] = [];

  return {
    afterEach: async (): Promise<void> => {
      await Promise.all(running.splice(0).map(async (runningApp) => runningApp.close()));
    },
    launch: async (): Promise<Page> => {
      const launched = await _electron.launch({
        args: [desktopMainEntry, '--repo', targetRepoPath],
      });
      running.push(launched);

      return launched.firstWindow();
    },
  };
};
