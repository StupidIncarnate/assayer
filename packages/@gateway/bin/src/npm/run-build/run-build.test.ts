import { runBuild } from './run-build';
import { runBuildProxy } from './run-build.proxy';
import { NpmNotInstalledError } from '../npm-run/npm-not-installed.error';

describe('runBuild()', () => {
  it('VALID: {no workspace} => runs npm run build at the repo root', async () => {
    const proxy = runBuildProxy();
    proxy.setupResult({ exitCode: 0, output: 'built' });

    const result = await runBuild({ cwd: '/repo' });

    expect(result).toStrictEqual({ exitCode: 0, output: 'built' });
    expect(proxy.getCallsFor({})).toStrictEqual([
      [{ command: 'npm', args: ['run', 'build'], cwd: '/repo' }],
    ]);
  });

  it('VALID: {workspace: "@scope/pkg"} => runs npm run build --workspace=@scope/pkg', async () => {
    const proxy = runBuildProxy();
    proxy.setupResult({ workspace: '@scope/pkg', exitCode: 0, output: '' });

    const result = await runBuild({ cwd: '/repo', workspace: '@scope/pkg' });

    expect(result).toStrictEqual({ exitCode: 0, output: '' });
  });

  it('ERROR: {exitCode: 1, output: "npm ERR! Missing script"} => returns it, does not throw', async () => {
    const proxy = runBuildProxy();
    proxy.setupResult({ workspace: '@scope/pkg', exitCode: 1, output: 'npm ERR! Missing script' });

    const result = await runBuild({ cwd: '/repo', workspace: '@scope/pkg' });

    expect(result).toStrictEqual({ exitCode: 1, output: 'npm ERR! Missing script' });
  });

  it('ERROR: {npm is not installed, no workspace} => throws NpmNotInstalledError', async () => {
    const proxy = runBuildProxy();
    proxy.setupNotFound({});

    await expect(runBuild({ cwd: '/repo' })).rejects.toStrictEqual(
      new NpmNotInstalledError(
        'npm run build could not start in /repo: "npm" never started: ENOENT: open \'npm\'',
      ),
    );
  });

  it('ERROR: {npm is not installed, workspace: "@scope/pkg"} => throws NpmNotInstalledError', async () => {
    const proxy = runBuildProxy();
    proxy.setupNotFound({ workspace: '@scope/pkg' });

    await expect(runBuild({ cwd: '/repo', workspace: '@scope/pkg' })).rejects.toStrictEqual(
      new NpmNotInstalledError(
        'npm run build --workspace=@scope/pkg could not start in /repo: "npm" never started: ENOENT: open \'npm\'',
      ),
    );
  });

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingWorkspace, a predicate} => resolves for a workspace the predicate accepts', async () => {
      const proxy = runBuildProxy();
      proxy.returnsMatchingWorkspace({
        workspace: (value) => String(value).startsWith('@assayer/'),
        exitCode: 0,
        output: '',
      });

      const result = await runBuild({ cwd: '/repo', workspace: '@assayer/computed' });

      expect(result).toStrictEqual({ exitCode: 0, output: '' });
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the actual cwd', async () => {
      const proxy = runBuildProxy();
      proxy.setupResult({ workspace: '@scope/pkg', exitCode: 0, output: '' });

      await runBuild({ cwd: '/worktrees/computed-at-runtime', workspace: '@scope/pkg' });

      expect(proxy.getCallsFor({ workspace: '@scope/pkg' })).toStrictEqual([
        [
          {
            command: 'npm',
            args: ['run', 'build', '--workspace=@scope/pkg'],
            cwd: '/worktrees/computed-at-runtime',
          },
        ],
      ]);
    });
  });
});
