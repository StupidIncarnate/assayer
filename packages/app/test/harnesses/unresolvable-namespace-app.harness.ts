/**
 * PURPOSE: Launches the REAL built Electron desktop app (desktop/dist/bin/desktop-main.js) against a
 *   freshly-seeded temp config dir whose .assayer/cache/manifest.json lists TWO working-tree
 *   namespaces — two entries with no commit, where exactly one is the dirty working tree. That drives
 *   the Compiled Surface Explorer's tree-fetch FAILURE terminal: currentNamespaceTransformer cannot
 *   pick a current namespace and raises a P1 error naming both entries in conflict. Exposes the window
 *   as a Playwright Page and owns teardown via afterEach (closes the app AND removes the temp dir).
 *   Requires `npm run build` and a display.
 *
 *   The manifest is contract-VALID (`commit` is optional, so two commitless entries parse): the fault
 *   is semantic, which is what makes it reach the resolver and produce a real message rather than
 *   being rejected at the cache's edge.
 *
 * USAGE:
 * const brokenApp = unresolvableNamespaceAppHarness();
 * wireHarnessLifecycle({ harness: brokenApp });
 * const window = await brokenApp.launch();
 * // window.getByTestId('SURFACE_ERROR') carries the resolver's own sentence, verbatim
 */
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { _electron } from '@playwright/test';
import type { ElectronApplication, Page } from '@playwright/test';
import { AssayerCacheManifestStub } from '@assayer/shared/contracts';

const desktopMainEntry = join(__dirname, '..', '..', '..', 'desktop', 'dist', 'bin', 'desktop-main.js');

export const unresolvableNamespaceAppHarness = (): {
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
      const configDir = mkdtempSync(join(tmpdir(), 'assayer-unresolvable-namespace-'));
      cleanups.push(() => { rmSync(configDir, { recursive: true, force: true }); });
      mkdirSync(join(configDir, '.assayer', 'cache'), { recursive: true });
      const manifest = AssayerCacheManifestStub({
        namespaces: {
          'branch-a': { branch: 'branch-a', files: [] },
          'branch-b': { branch: 'branch-b', files: [] },
        },
      });
      writeFileSync(join(configDir, '.assayer', 'cache', 'manifest.json'), JSON.stringify(manifest));

      const launched = await _electron.launch({ args: [desktopMainEntry, '--repo', configDir] });
      running.push(launched);

      return launched.firstWindow();
    },
  };
};
