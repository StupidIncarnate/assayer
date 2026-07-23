/**
 * PURPOSE: Playwright e2e entrypoint for the Assayer desktop app. Re-exports test/expect so specs never
 *   import @playwright/test directly, and owns the shared smoke-repo lifecycle so specs never manage it:
 *
 *   - a WORKER-scoped `smokeApp` fixture launches ONE Electron process against the single shared compiled
 *     cache (built once in globalSetup) and warms it — the first paint pays Chromium's one-time
 *     DOM-storage init, which every later reload then skips;
 *   - a per-test `smokeWindow` fixture resets the shared cache's mutable state (purges saved runs), clears
 *     the renderer's persisted UI state, and RELOADS the warm renderer to a clean `/` — ~0.2s, versus the
 *     ~8s a cold Electron launch costs. A spec just declares `async ({ smokeWindow: window }) => …` and
 *     gets a ready, isolated window; no compile, no launch, no teardown.
 *
 *   A test that needs the `intelligent` gray-out calls `reloadSmokeRunMode`. `wireHarnessLifecycle`
 *   remains for the no-tree terminal-states specs, which seed their own caches.
 *
 * USAGE:
 * import { test, expect } from '../../../test/harnesses/e2e-fixtures';
 * test('…', async ({ smokeWindow: window }) => {
 *   await expect(window.getByTestId('FILE_TREE')).toBeVisible({ timeout: 30_000 });
 * });
 */
import { test as base, expect, _electron } from '@playwright/test';
import type { ElectronApplication, Page } from '@playwright/test';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { desktopMainEntry, smokeCacheConfigDir, resetSmokeCache } from './smoke-cache.harness';

export interface HarnessLifecycle {
  afterEach?: () => Promise<void> | void;
}

interface SmokeFixtures {
  smokeWindow: Page;
}

interface SmokeWorkerFixtures {
  smokeCacheDir: AbsoluteFilePath;
  smokeApp: { app: ElectronApplication; window: Page };
}

export const test = base.extend<SmokeFixtures, SmokeWorkerFixtures>({
  // The compiled cache the shared window reads — a worker-scoped VALUE fixture, so the launch below has a
  // real dependency to destructure (Playwright requires a fixture's first arg to be an object pattern).
  smokeCacheDir: [absoluteFilePathContract.parse(smokeCacheConfigDir), { option: true, scope: 'worker' }],

  // beforeAll (worker-scoped): launch ONE Electron against the shared compiled cache and warm it. The
  // first paint pays Chromium's one-time DOM-storage service init (~8s here); with the process kept
  // alive, every per-test reload re-reaches the tree in ~0.2s. The wait bubbles any warm-up failure.
  smokeApp: [
    async ({ smokeCacheDir }, use): Promise<void> => {
      const app = await _electron.launch({ args: [desktopMainEntry, '--repo', smokeCacheDir] });
      const window = await app.firstWindow();
      await window.getByTestId('FILE_TREE').waitFor({ state: 'visible', timeout: 30_000 });
      await use({ app, window });
      await app.close();
    },
    { scope: 'worker' },
  ],

  // beforeEach: reset the shared cache to a clean thorough state (purge saved runs), clear the
  // renderer's persisted UI state + route, and reload the warm window to a clean `/`.
  smokeWindow: async ({ smokeApp }, use): Promise<void> => {
    resetSmokeCache({ runMode: 'thorough' });
    await smokeApp.window.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
      globalThis.location.hash = '';
    });
    await smokeApp.window.reload({ waitUntil: 'load' });
    await use(smokeApp.window);
  },
});

// Re-point the shared cache's display-only runMode and reload the warm window — the one test that proves
// the `intelligent` gray-out calls this instead of the default thorough reset the fixture applies.
export const reloadSmokeRunMode = async ({
  window,
  runMode,
}: {
  window: Page;
  runMode: 'thorough' | 'intelligent';
}): Promise<void> => {
  resetSmokeCache({ runMode });
  await window.reload({ waitUntil: 'load' });
};

export const wireHarnessLifecycle = ({ harness }: { harness: HarnessLifecycle }): void => {
  test.afterEach(async () => {
    await harness.afterEach?.();
  });
};

export { expect };
