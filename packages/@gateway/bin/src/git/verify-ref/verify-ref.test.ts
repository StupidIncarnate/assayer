import { verifyRef } from './verify-ref';
import { verifyRefProxy } from './verify-ref.proxy';
import { GitNotInstalledError } from '../git-run/git-not-installed.error';

describe('verifyRef()', () => {
  it('VALID: {ref: "main", exitCode: 0} => returns true', async () => {
    const proxy = verifyRefProxy();
    proxy.setupResult({ ref: 'main', exitCode: 0 });

    const result = await verifyRef({ cwd: '/repo', ref: 'main' });

    expect(result).toBe(true);
  });

  it('INVALID: {ref: "nope", exitCode: 128} => returns false', async () => {
    const proxy = verifyRefProxy();
    proxy.setupResult({ ref: 'nope', exitCode: 128 });

    const result = await verifyRef({ cwd: '/repo', ref: 'nope' });

    expect(result).toBe(false);
  });

  it('ERROR: {git is not installed} => throws GitNotInstalledError', async () => {
    const proxy = verifyRefProxy();
    proxy.setupNotFound({ ref: 'main' });

    await expect(verifyRef({ cwd: '/repo', ref: 'main' })).rejects.toStrictEqual(
      new GitNotInstalledError(
        'git rev-parse --verify main could not start in /repo: "git" never started: ENOENT: open \'git\'',
      ),
    );
  });

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingRef, a predicate} => resolves for a ref the predicate accepts', async () => {
      const proxy = verifyRefProxy();
      proxy.returnsMatchingRef({ ref: (value) => String(value).length > 0, exitCode: 0 });

      const result = await verifyRef({ cwd: '/repo', ref: 'computed-at-runtime' });

      expect(result).toBe(true);
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the actual cwd', async () => {
      const proxy = verifyRefProxy();
      proxy.setupResult({ ref: 'main', exitCode: 0 });

      await verifyRef({ cwd: '/worktrees/computed-at-runtime', ref: 'main' });

      expect(proxy.getCallsFor({ ref: 'main' })).toStrictEqual([
        [
          {
            command: 'git',
            args: ['rev-parse', '--verify', 'main'],
            cwd: '/worktrees/computed-at-runtime',
          },
        ],
      ]);
    });
  });
});
