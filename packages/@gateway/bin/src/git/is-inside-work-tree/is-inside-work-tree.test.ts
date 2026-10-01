import { isInsideWorkTree } from './is-inside-work-tree';
import { isInsideWorkTreeProxy } from './is-inside-work-tree.proxy';
import { GitNotInstalledError } from '../git-run/git-not-installed.error';

describe('isInsideWorkTree()', () => {
  it('VALID: {inside a working tree} => returns true', async () => {
    const proxy = isInsideWorkTreeProxy();
    proxy.setupInside();

    const result = await isInsideWorkTree({ cwd: '/repo' });

    expect(result).toBe(true);
  });

  it('EDGE: {inside the .git directory, exitCode: 0, output: "false"} => returns false', async () => {
    const proxy = isInsideWorkTreeProxy();
    proxy.setupInsideGitDir();

    const result = await isInsideWorkTree({ cwd: '/repo/.git' });

    expect(result).toBe(false);
  });

  it('INVALID: {not a git repository, exitCode: 128} => returns false', async () => {
    const proxy = isInsideWorkTreeProxy();
    proxy.setupNotRepo();

    const result = await isInsideWorkTree({ cwd: '/tmp/plain-folder' });

    expect(result).toBe(false);
  });

  it('ERROR: {git is not installed} => throws GitNotInstalledError', async () => {
    const proxy = isInsideWorkTreeProxy();
    proxy.setupNotFound();

    await expect(isInsideWorkTree({ cwd: '/repo' })).rejects.toStrictEqual(
      new GitNotInstalledError(
        'git rev-parse --is-inside-work-tree could not start in /repo: "git" never started: ENOENT: open \'git\'',
      ),
    );
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the actual cwd', async () => {
      const proxy = isInsideWorkTreeProxy();
      proxy.setupInside();

      await isInsideWorkTree({ cwd: '/repo/computed-at-runtime' });

      expect(proxy.getCallsFor()).toStrictEqual([
        [
          {
            command: 'git',
            args: ['rev-parse', '--is-inside-work-tree'],
            cwd: '/repo/computed-at-runtime',
          },
        ],
      ]);
    });
  });
});
