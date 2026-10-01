import { branchList } from './branch-list';
import { branchListProxy } from './branch-list.proxy';
import { GitNotInstalledError } from '../git-run/git-not-installed.error';

describe('branchList()', () => {
  it('VALID: {one branch, a warning on stderr} => returns names from stdout alone', async () => {
    const proxy = branchListProxy();
    proxy.setupBranches({ patterns: ['main', 'master'], output: '* main\n', stderr: "warning: refname 'main' is ambiguous.\n" });

    const result = await branchList({ cwd: '/repo', patterns: ['main', 'master'] });

    expect(result).toStrictEqual(['main']);
  });

  it('VALID: {one branch, HEAD on it} => returns its name without the marker', async () => {
    const proxy = branchListProxy();
    proxy.setupBranches({ patterns: ['main', 'master'], output: '* main\n' });

    const result = await branchList({ cwd: '/repo', patterns: ['main', 'master'] });

    expect(result).toStrictEqual(['main']);
  });

  it('VALID: {three branches, each marker kind} => returns every name in git order', async () => {
    const proxy = branchListProxy();
    proxy.setupBranches({
      patterns: ['main', 'master', 'release'],
      output: '  main\n* master\n+ release\n',
    });

    const result = await branchList({ cwd: '/repo', patterns: ['main', 'master', 'release'] });

    expect(result).toStrictEqual(['main', 'master', 'release']);
  });

  it('EMPTY: {no branch matches} => returns an empty array', async () => {
    const proxy = branchListProxy();
    proxy.setupBranches({ patterns: ['main', 'master'], output: '' });

    const result = await branchList({ cwd: '/repo', patterns: ['main', 'master'] });

    expect(result).toStrictEqual([]);
  });

  it('INVALID: {not a git repository, exitCode: 128} => returns null', async () => {
    const proxy = branchListProxy();
    proxy.setupFailure({
      patterns: ['main', 'master'],
      exitCode: 128,
      output: 'fatal: not a git repository (or any of the parent directories): .git\n',
    });

    const result = await branchList({ cwd: '/repo', patterns: ['main', 'master'] });

    expect(result).toBe(null);
  });

  it('ERROR: {git is not installed} => throws GitNotInstalledError', async () => {
    const proxy = branchListProxy();
    proxy.setupNotFound({ patterns: ['main', 'master'] });

    await expect(branchList({ cwd: '/repo', patterns: ['main', 'master'] })).rejects.toStrictEqual(
      new GitNotInstalledError(
        'git branch --list main master could not start in /repo: "git" never started: ENOENT: open \'git\'',
      ),
    );
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the args and the actual cwd', async () => {
      const proxy = branchListProxy();
      proxy.setupBranches({ patterns: ['main', 'master'], output: '* main\n' });

      await branchList({ cwd: '/repo/computed-at-runtime', patterns: ['main', 'master'] });

      expect(proxy.getCallsFor({ patterns: ['main', 'master'] })).toStrictEqual([
        [
          {
            command: 'git',
            args: ['branch', '--list', 'main', 'master'],
            cwd: '/repo/computed-at-runtime',
          },
        ],
      ]);
    });
  });
});
