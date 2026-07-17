/**
 * PURPOSE: Isolated smoke-repo e2e driver — compiles the REAL smoke-repo source into a PER-TEST temp
 *   cache dir via the built assayer CLI, then launches the REAL built Electron desktop app against that
 *   same temp dir. Unlike the shared repo `.assayer/cache`, each test gets its own hermetic cache
 *   (created in beforeEach, removed in afterEach), so stale-schema blobs or dev cache state can never
 *   affect the run. The temp config points repoRoot at the ABSOLUTE smoke-repo path (git branch
 *   namespacing still resolves through the enclosing monorepo), the temp dir is named `assayer` so the
 *   header's repoName reads `assayer`, and the precheck's config mutation is snapshotted + restored so
 *   the desktop's configHash matches the written manifest. Requires `npm run build` and a display.
 *
 * USAGE:
 * const app = smokeRepoAppHarness();
 * wireHarnessLifecycle({ harness: app });
 * const exitCode = await app.compile();  // creates this test's temp cache dir; exit 0 on precheck pass
 * const window = await app.launch();     // desktop reads THIS test's temp cache only
 */
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { _electron } from '@playwright/test';
import type { ElectronApplication, Page } from '@playwright/test';
import { ExitCodeStub } from '../../src/contracts/exit-code/exit-code.stub';
import type { ExitCode } from '../../src/contracts/exit-code/exit-code-contract';

const cliEntry = join(__dirname, '..', '..', '..', 'cli', 'dist', 'bin', 'assayer.js');
const desktopMainEntry = join(__dirname, '..', '..', '..', 'desktop', 'dist', 'bin', 'desktop-main.js');
const smokeRepoPath = join(__dirname, '..', '..', '..', '..', 'smoke-repo');

export const smokeRepoAppHarness = (): {
  afterEach: () => Promise<void>;
  compile: () => Promise<ExitCode>;
  launch: () => Promise<Page>;
} => {
  const running: ElectronApplication[] = [];
  const cleanups: (() => void)[] = [];
  const configDirRef = { current: '' };

  return {
    afterEach: async (): Promise<void> => {
      await Promise.all(running.splice(0).map(async (runningApp) => runningApp.close()));
      cleanups.splice(0).forEach((cleanup) => {
        cleanup();
      });
    },
    compile: async (): Promise<ExitCode> => {
      // Create THIS test's hermetic cache dir (wireHarnessLifecycle wires afterEach only, so the temp
      // dir is minted here on the first call, not in a beforeEach). basename(configDir) === 'assayer'
      // so the manifest's repoName reads 'assayer' — matching the header assertion.
      const parent = mkdtempSync(join(tmpdir(), 'assayer-smoke-'));
      cleanups.push(() => {
        rmSync(parent, { recursive: true, force: true });
      });
      const configDir = join(parent, 'assayer');
      mkdirSync(configDir, { recursive: true });
      const configPath = join(configDir, 'assayer.config.json');
      writeFileSync(
        configPath,
        JSON.stringify({ repoRoot: smokeRepoPath, exclude: [], stableBranch: 'master' }),
      );
      configDirRef.current = configDir;
      const original = readFileSync(configPath);
      return new Promise<ExitCode>((resolve, reject) => {
        const child = spawn(process.execPath, [cliEntry, 'status'], {
          cwd: configDirRef.current,
          stdio: 'ignore',
        });
        child.on('error', (error) => {
          writeFileSync(configPath, original);
          reject(error);
        });
        // A signal-killed compile reports code=null and names the signal instead; Node sets exactly one
        // of the two. Reporting that as an exit code would have to invent one, and the only value it
        // could invent is a pass — after which the precondition holds, no manifest exists, and the
        // scenario dies 30s later on a FILE_TREE that was never coming. The kill is the finding, so it
        // is raised where it happens.
        child.on('close', (code, signal) => {
          writeFileSync(configPath, original);
          if (code === null) {
            reject(
              new Error(
                `assayer: the CLI compile was killed by ${String(signal)} before it could write a cache manifest, so this test has no compiled surface to read. Re-run it; if the kill repeats, run \`node ${cliEntry} status\` in a temp config dir pointed at ${smokeRepoPath} to see what the CLI is dying of.`,
              ),
            );
            return;
          }
          resolve(ExitCodeStub({ value: code }));
        });
      });
    },
    launch: async (): Promise<Page> => {
      const launched = await _electron.launch({
        args: [desktopMainEntry, '--repo', configDirRef.current],
      });
      running.push(launched);
      return launched.firstWindow();
    },
  };
};
