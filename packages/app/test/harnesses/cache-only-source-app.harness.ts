/**
 * PURPOSE: Launches the REAL built Electron desktop app (desktop/dist/bin/desktop-main.js) against a
 *   hermetic temp config dir (repoRoot='.', so config dir === repoRoot) whose .assayer/cache DIVERGES
 *   from the on-disk source, proving the explorer serves ONLY the cache (obs-no-source-read /
 *   obs-file-from-cache-blob). The seed:
 *     - on disk at <repoRoot>/src/format-greeting.ts: an ALTERED source line ('FROM-ON-DISK-SOURCE')
 *       that must NEVER render — the "altered repoRoot source file" case;
 *     - cached blob for src/format-greeting.ts: the DIFFERENT compiled line ('FROM-CACHE-BLOB');
 *     - a second manifest entry src/ghost.ts with NO on-disk file at all — the "deleted/absent source
 *       file" case, so a rendered ghost.ts leaf proves the tree is rebuilt from cache relPaths, not a
 *       filesystem scan.
 *   Builds manifest + blobs from the shared stubs (valid contract shapes), exposes the window as a
 *   Playwright Page, and owns teardown via afterEach (closes the app AND removes the temp dir).
 *   Requires `npm run build` and a display.
 *
 * USAGE:
 * const cacheOnlyApp = cacheOnlySourceAppHarness();
 * wireHarnessLifecycle({ harness: cacheOnlyApp });
 * const window = await cacheOnlyApp.launch();
 * // Clicking format-greeting.ts renders the CACHED line, never the on-disk 'FROM-ON-DISK-SOURCE'
 */
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { _electron } from '@playwright/test';
import type { ElectronApplication, Page } from '@playwright/test';
import { AssayerCacheManifestStub, CompiledFileBlobStub } from '@assayer/shared/contracts';

const desktopMainEntry = join(__dirname, '..', '..', '..', 'desktop', 'dist', 'bin', 'desktop-main.js');

const greetingHash = '1111111111111111111111111111111111111111111111111111111111111111';
const ghostHash = '2222222222222222222222222222222222222222222222222222222222222222';
const lineHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

export const cacheOnlySourceAppHarness = (): {
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
      const configDir = mkdtempSync(join(tmpdir(), 'assayer-cache-only-'));
      cleanups.push(() => { rmSync(configDir, { recursive: true, force: true }); });

      // On-disk source (repoRoot=configDir): an ALTERED file whose bytes differ from the cache. If
      // the desktop ever read repoRoot source, this is what it would show — so rendering the cached
      // line instead proves the source is never read. src/ghost.ts is intentionally NOT written.
      mkdirSync(join(configDir, 'src'), { recursive: true });
      writeFileSync(
        join(configDir, 'src', 'format-greeting.ts'),
        "export function formatGreeting(name: string): string {\n  return 'FROM-ON-DISK-SOURCE';\n}\n",
      );

      mkdirSync(join(configDir, '.assayer', 'cache', 'blobs'), { recursive: true });

      const manifest = AssayerCacheManifestStub({
        repoName: 'assayer',
        rootFolderName: 'fixture-root',
        namespaces: {
          master: {
            files: [
              { relPath: 'src/format-greeting.ts', contentHash: greetingHash },
              { relPath: 'src/ghost.ts', contentHash: ghostHash },
            ],
          },
        },
      });
      writeFileSync(join(configDir, '.assayer', 'cache', 'manifest.json'), JSON.stringify(manifest));

      const greetingBlob = CompiledFileBlobStub({
        relPath: 'src/format-greeting.ts',
        contentHash: greetingHash,
        nodes: [{ kind: 'function', startLine: 1, endLine: 3 }],
        lines: [
          { n: 1, text: 'export function formatGreeting(name: string): string {', hash: lineHash },
          { n: 2, text: "  return 'FROM-CACHE-BLOB';", hash: lineHash },
          { n: 3, text: '}', hash: lineHash },
        ],
      });
      writeFileSync(
        join(configDir, '.assayer', 'cache', 'blobs', `${greetingHash}.json`),
        JSON.stringify(greetingBlob),
      );

      const ghostBlob = CompiledFileBlobStub({
        relPath: 'src/ghost.ts',
        contentHash: ghostHash,
        nodes: [{ kind: 'function', startLine: 1, endLine: 1 }],
        lines: [{ n: 1, text: "export const ghost = 'no on-disk source exists';", hash: lineHash }],
      });
      writeFileSync(
        join(configDir, '.assayer', 'cache', 'blobs', `${ghostHash}.json`),
        JSON.stringify(ghostBlob),
      );

      const launched = await _electron.launch({ args: [desktopMainEntry, '--repo', configDir] });
      running.push(launched);

      return launched.firstWindow();
    },
  };
};
