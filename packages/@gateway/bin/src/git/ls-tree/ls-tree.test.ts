import { lsTree } from './ls-tree';
import { lsTreeProxy } from './ls-tree.proxy';
import { GitNotInstalledError } from '../git-run/git-not-installed.error';

describe('lsTree()', () => {
  it('VALID: {one file, a warning on stderr} => returns records from stdout alone', async () => {
    const proxy = lsTreeProxy();
    proxy.setupTree({
      ref: 'HEAD',
      output: '100644 blob e3b0c44298fc1c149afbf4c8996fb92427ae41e4\tpackages/shared/index.ts\n',
      stderr: "warning: refname 'main' is ambiguous.\n",
    });

    const result = await lsTree({ cwd: '/repo', ref: 'HEAD' });

    expect(result).toStrictEqual([
      {
        mode: '100644',
        type: 'blob',
        sha: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4',
        path: 'packages/shared/index.ts',
      },
    ]);
  });

  it('VALID: {a tree with two files} => returns one record per entry', async () => {
    const proxy = lsTreeProxy();
    proxy.setupTree({
      ref: 'HEAD',
      output:
        '100644 blob e3b0c44298fc1c149afbf4c8996fb92427ae41e4\tpackages/shared/index.ts\n' +
        '100755 blob a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0\tscripts/run.sh\n',
    });

    const result = await lsTree({ cwd: '/repo', ref: 'HEAD' });

    expect(result).toStrictEqual([
      {
        mode: '100644',
        type: 'blob',
        sha: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4',
        path: 'packages/shared/index.ts',
      },
      {
        mode: '100755',
        type: 'blob',
        sha: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
        path: 'scripts/run.sh',
      },
    ]);
  });

  it('VALID: {a submodule entry} => returns it with type "commit"', async () => {
    const proxy = lsTreeProxy();
    proxy.setupTree({
      ref: 'HEAD',
      output: '160000 commit 9fceb02f1a3e4c98d9c8b1e6f2a7d5c3b0e1f4a2\tvendor/lib\n',
    });

    const result = await lsTree({ cwd: '/repo', ref: 'HEAD' });

    expect(result).toStrictEqual([
      {
        mode: '160000',
        type: 'commit',
        sha: '9fceb02f1a3e4c98d9c8b1e6f2a7d5c3b0e1f4a2',
        path: 'vendor/lib',
      },
    ]);
  });

  it('EDGE: {a line with no tab and no spaces} => returns empty fields for what is missing', async () => {
    const proxy = lsTreeProxy();
    proxy.setupTree({ ref: 'HEAD', output: 'garbled\n' });

    const result = await lsTree({ cwd: '/repo', ref: 'HEAD' });

    expect(result).toStrictEqual([{ mode: 'garbled', type: '', sha: '', path: '' }]);
  });

  it('EMPTY: {a tree with no entries} => returns an empty array', async () => {
    const proxy = lsTreeProxy();
    proxy.setupTree({ ref: 'HEAD', output: '' });

    const result = await lsTree({ cwd: '/repo', ref: 'HEAD' });

    expect(result).toStrictEqual([]);
  });

  it('INVALID: {ref: "nope", exitCode: 128} => returns null', async () => {
    const proxy = lsTreeProxy();
    proxy.setupFailure({ ref: 'nope', exitCode: 128, output: 'fatal: Not a valid object name nope\n' });

    const result = await lsTree({ cwd: '/repo', ref: 'nope' });

    expect(result).toBe(null);
  });

  it('ERROR: {git is not installed} => throws GitNotInstalledError', async () => {
    const proxy = lsTreeProxy();
    proxy.setupNotFound({ ref: 'HEAD' });

    await expect(lsTree({ cwd: '/repo', ref: 'HEAD' })).rejects.toStrictEqual(
      new GitNotInstalledError(
        'git ls-tree -r HEAD could not start in /repo: "git" never started: ENOENT: open \'git\'',
      ),
    );
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the args and the actual cwd', async () => {
      const proxy = lsTreeProxy();
      proxy.setupTree({ ref: 'main', output: '' });

      await lsTree({ cwd: '/repo/computed-at-runtime', ref: 'main' });

      expect(proxy.getCallsFor({ ref: 'main' })).toStrictEqual([
        [{ command: 'git', args: ['ls-tree', '-r', 'main'], cwd: '/repo/computed-at-runtime' }],
      ]);
    });
  });
});
