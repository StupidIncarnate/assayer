import { RunResultStub } from '@assayer/shared/contracts';

import { runExecuteBroker } from './run-execute-broker';
import { runExecuteBrokerProxy } from './run-execute-broker.proxy';
import { join } from '#gateway/node/path';
import { envSnapshot } from '#gateway/node/process';

// The sha256 of `relPath\nsource` for src/a.ts, the id the runner names its run directory with.
const RUN_ID = 'c73c5a78c49441e87716db0bd78ae3b2c0f5c1fa0c00c420f8ad7f32761c6931';

describe('runExecuteBroker', () => {
  describe('a run from the UI', () => {
    it('VALID: {a file} => the saved run', async () => {
      const proxy = runExecuteBrokerProxy();
      proxy.savedRun({ repoPath: '/repo', relPath: 'src/a.ts', harnessPath: '/repo/src/a.harness.ts', runId: RUN_ID, run: RunResultStub() });

      const result = await runExecuteBroker({ repoPath: '/repo', root: '/repo', relPath: 'src/a.ts' });

      expect(result).toStrictEqual(RunResultStub());
    });

    // The SAME binary a human would type. One execution path is what keeps "run in the UI" and "run
    // headless" from becoming two implementations that disagree.
    //
    // ELECTRON_RUN_AS_NODE is load-bearing, not decoration: in the main process `process.execPath` is
    // the Electron binary, which given a script path boots a second Electron app that never exits —
    // so without the flag the run never returns and the UI spins forever.
    it('VALID: {a file} => spawns the built CLI with `unit <relPath>` in the repo, as node rather than as an Electron app', async () => {
      const proxy = runExecuteBrokerProxy();
      proxy.runSucceeds({ repoPath: '/repo', relPath: 'src/a.ts', harnessPath: '/repo/src/a.harness.ts', runId: RUN_ID });

      await runExecuteBroker({ repoPath: '/repo', root: '/repo', relPath: 'src/a.ts' });

      expect({ args: proxy.getSpawnArgs(), options: proxy.getSpawnOptions() }).toStrictEqual({
        args: [[join(__dirname, 'packages', 'cli', 'dist', 'bin', 'assayer.js'), 'unit', 'src/a.ts']],
        options: [
          {
            cwd: '/repo',
            env: { ...envSnapshot(), ELECTRON_RUN_AS_NODE: '1' },
            stdio: ['ignore', 'pipe', 'pipe'],
          },
        ],
      });
    });

    it('VALID: {a file, an onOutput callback} => the CLI output reaches the callback as it is written', async () => {
      const proxy = runExecuteBrokerProxy();
      proxy.runSucceeds({ repoPath: '/repo', relPath: 'src/a.ts', harnessPath: '/repo/src/a.harness.ts', runId: RUN_ID });
      const chunks: string[] = [];

      await runExecuteBroker({
        repoPath: '/repo',
        root: '/repo',
        relPath: 'src/a.ts',
        onOutput: ({ chunk }) => {
          chunks.push(chunk);
        },
      });

      expect(chunks).toStrictEqual(['src/a.ts  1/1 passed']);
    });

    // A failing CASE is a normal outcome with a perfectly good artifact behind it — the exit code is
    // not the verdict, and treating it as one would hide every failure the UI exists to show.
    it('VALID: {a run whose cases failed} => still returns the artifact', async () => {
      const proxy = runExecuteBrokerProxy();
      const failing = RunResultStub({ cases: [] });
      proxy.savedRun({ repoPath: '/repo', relPath: 'src/a.ts', harnessPath: '/repo/src/a.harness.ts', runId: RUN_ID, run: failing });

      const result = await runExecuteBroker({ repoPath: '/repo', root: '/repo', relPath: 'src/a.ts' });

      expect(result).toStrictEqual(failing);
    });
  });

  describe('a run that produced nothing', () => {
    // No artifact IS an error, unlike a failing case: the CLI's own report is the message, never a
    // paraphrase of it.
    it('ERROR: {no artifact} => throws carrying the CLI report', async () => {
      const proxy = runExecuteBrokerProxy();
      proxy.noArtifact({ repoPath: '/repo', relPath: 'src/a.ts', harnessPath: '/repo/src/a.harness.ts', runId: RUN_ID, stderr: 'assayer.config.json: invalid JSON at line 3' });

      await expect(runExecuteBroker({ repoPath: '/repo', root: '/repo', relPath: 'src/a.ts' })).rejects.toThrow(
        /assayer\.config\.json: invalid JSON at line 3/u,
      );
    });
  });

  describe('an unbuilt CLI', () => {
    it('ERROR: {no built CLI} => throws saying so rather than spawning nothing', async () => {
      const proxy = runExecuteBrokerProxy();
      proxy.cliNotBuilt();

      await expect(runExecuteBroker({ repoPath: '/repo', root: '/repo', relPath: 'src/a.ts' })).rejects.toThrow(
        /the CLI is not built/u,
      );
    });
  });
});
