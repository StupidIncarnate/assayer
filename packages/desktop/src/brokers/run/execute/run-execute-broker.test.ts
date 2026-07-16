import { RunResultStub } from '@assayer/shared/contracts';

import { runExecuteBroker } from './run-execute-broker';
import { runExecuteBrokerProxy } from './run-execute-broker.proxy';

describe('runExecuteBroker', () => {
  describe('a run from the UI', () => {
    it('VALID: {a file} => the saved run', async () => {
      const proxy = runExecuteBrokerProxy();
      proxy.savedRun({ run: RunResultStub() });

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

      await runExecuteBroker({ repoPath: '/repo', root: '/repo', relPath: 'src/a.ts' });

      expect(proxy.getSpawnArgs()).toStrictEqual([
        process.execPath,
        ['/repo/packages/cli/dist/bin/assayer.js', 'unit', 'src/a.ts'],
        {
          cwd: '/repo',
          env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      ]);
    });

    // A failing CASE is a normal outcome with a perfectly good artifact behind it — the exit code is
    // not the verdict, and treating it as one would hide every failure the UI exists to show.
    it('VALID: {a run whose cases failed} => still returns the artifact', async () => {
      const proxy = runExecuteBrokerProxy();
      const failing = RunResultStub({ cases: [] });
      proxy.savedRun({ run: failing });

      const result = await runExecuteBroker({ repoPath: '/repo', root: '/repo', relPath: 'src/a.ts' });

      expect(result).toStrictEqual(failing);
    });
  });

  describe('a run that produced nothing', () => {
    // No artifact IS an error, unlike a failing case: the CLI's own report is the message, never a
    // paraphrase of it.
    it('ERROR: {no artifact} => throws carrying the CLI report', async () => {
      const proxy = runExecuteBrokerProxy();
      proxy.noArtifact({ stderr: 'assayer.config.json: invalid JSON at line 3' });

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
