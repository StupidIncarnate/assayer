import { resolveRef } from './resolve-ref';
import { resolveRefProxy } from './resolve-ref.proxy';
import { GitNotInstalledError } from '../git-run/git-not-installed.error';

describe('resolveRef()', () => {
  it('VALID: {ref: "master"} => returns the trimmed full sha', async () => {
    const proxy = resolveRefProxy();
    proxy.setupResolves({ ref: 'master', sha: '9fceb02f1a3e4c98d9c8b1e6f2a7d5c3b0e1f4a2' });

    const result = await resolveRef({ cwd: '/repo', ref: 'master' });

    expect(result).toBe('9fceb02f1a3e4c98d9c8b1e6f2a7d5c3b0e1f4a2');
  });

  it('VALID: {ref: "HEAD", short: true} => returns the trimmed short sha', async () => {
    const proxy = resolveRefProxy();
    proxy.setupResolves({ ref: 'HEAD', short: true, sha: 'abc1234' });

    const result = await resolveRef({ cwd: '/repo', ref: 'HEAD', short: true });

    expect(result).toBe('abc1234');
  });

  it('VALID: {ref: "HEAD", short: false} => asks git for the full sha', async () => {
    const proxy = resolveRefProxy();
    proxy.setupResolves({ ref: 'HEAD', sha: '9fceb02f1a3e4c98d9c8b1e6f2a7d5c3b0e1f4a2' });

    const result = await resolveRef({ cwd: '/repo', ref: 'HEAD', short: false });

    expect(result).toBe('9fceb02f1a3e4c98d9c8b1e6f2a7d5c3b0e1f4a2');
  });

  it('INVALID: {ref: "does-not-exist", exitCode: 128} => returns null', async () => {
    const proxy = resolveRefProxy();
    proxy.setupMissing({
      ref: 'does-not-exist',
      output: "fatal: ambiguous argument 'does-not-exist': unknown revision or path not in the working tree.\n",
    });

    const result = await resolveRef({ cwd: '/repo', ref: 'does-not-exist' });

    expect(result).toBe(null);
  });

  it('EMPTY: {exitCode: 0, output: ""} => returns null', async () => {
    const proxy = resolveRefProxy();
    proxy.setupResolves({ ref: 'master', sha: '' });

    const result = await resolveRef({ cwd: '/repo', ref: 'master' });

    expect(result).toBe(null);
  });

  it('ERROR: {git is not installed} => throws GitNotInstalledError', async () => {
    const proxy = resolveRefProxy();
    proxy.setupNotFound({ ref: 'HEAD', short: true });

    await expect(resolveRef({ cwd: '/repo', ref: 'HEAD', short: true })).rejects.toStrictEqual(
      new GitNotInstalledError(
        'git rev-parse --short HEAD could not start in /repo: "git" never started: ENOENT: open \'git\'',
      ),
    );
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the args and the actual cwd', async () => {
      const proxy = resolveRefProxy();
      proxy.setupResolves({ ref: 'HEAD', short: true, sha: 'abc1234' });

      await resolveRef({ cwd: '/repo/computed-at-runtime', ref: 'HEAD', short: true });

      expect(proxy.getCallsFor({ ref: 'HEAD', short: true })).toStrictEqual([
        [
          {
            command: 'git',
            args: ['rev-parse', '--short', 'HEAD'],
            cwd: '/repo/computed-at-runtime',
          },
        ],
      ]);
    });
  });
});
