import { headSha } from './head-sha';
import { headShaProxy } from './head-sha.proxy';
import { GitNotInstalledError } from '../git-run/git-not-installed.error';

describe('headSha()', () => {
  it('VALID: {sha} => returns the trimmed sha', async () => {
    const proxy = headShaProxy();
    proxy.setupResult({ exitCode: 0, output: 'a1b2c3d4\n' });

    const result = await headSha({ cwd: '/repo' });

    expect(result).toBe('a1b2c3d4');
  });

  it('ERROR: {exitCode: 128} => returns null', async () => {
    const proxy = headShaProxy();
    proxy.setupResult({ exitCode: 128, output: 'fatal: not a git repository' });

    const result = await headSha({ cwd: '/repo' });

    expect(result).toBe(null);
  });

  it('EMPTY: {exitCode: 0, output: ""} => returns null', async () => {
    const proxy = headShaProxy();
    proxy.setupResult({ exitCode: 0, output: '' });

    const result = await headSha({ cwd: '/repo' });

    expect(result).toBe(null);
  });

  it('ERROR: {git is not installed} => throws GitNotInstalledError', async () => {
    const proxy = headShaProxy();
    proxy.setupNotFound();

    await expect(headSha({ cwd: '/repo' })).rejects.toStrictEqual(
      new GitNotInstalledError(
        'git rev-parse HEAD could not start in /repo: "git" never started: ENOENT: open \'git\'',
      ),
    );
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the actual cwd', async () => {
      const proxy = headShaProxy();
      proxy.setupResult({ exitCode: 0, output: 'a1b2c3d4' });

      await headSha({ cwd: '/worktrees/computed-at-runtime' });

      expect(proxy.getCallsFor()).toStrictEqual([
        [{ command: 'git', args: ['rev-parse', 'HEAD'], cwd: '/worktrees/computed-at-runtime' }],
      ]);
    });
  });
});
