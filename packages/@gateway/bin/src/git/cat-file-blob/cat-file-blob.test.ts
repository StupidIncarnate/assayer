import { catFileBlob } from './cat-file-blob';
import { catFileBlobProxy } from './cat-file-blob.proxy';
import { GitNotInstalledError } from '../git-run/git-not-installed.error';

describe('catFileBlob()', () => {
  it('VALID: {a committed blob, a warning on stderr} => returns the blob contents from stdout alone', async () => {
    const proxy = catFileBlobProxy();
    proxy.setupBlob({
      sha: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4',
      contents: 'export const x = 1;\n',
      stderr: "warning: refname 'main' is ambiguous.\n",
    });

    const result = await catFileBlob({ cwd: '/repo', sha: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4' });

    expect(result).toBe('export const x = 1;\n');
  });

  it('VALID: {a committed blob} => returns its exact contents, trailing newline kept', async () => {
    const proxy = catFileBlobProxy();
    proxy.setupBlob({
      sha: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4',
      contents: '  export const x = 1;\n\n',
    });

    const result = await catFileBlob({ cwd: '/repo', sha: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4' });

    expect(result).toBe('  export const x = 1;\n\n');
  });

  it('EMPTY: {an empty blob} => returns an empty string', async () => {
    const proxy = catFileBlobProxy();
    proxy.setupBlob({ sha: 'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391', contents: '' });

    const result = await catFileBlob({ cwd: '/repo', sha: 'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391' });

    expect(result).toBe('');
  });

  it('INVALID: {sha names no blob, exitCode: 128} => returns null', async () => {
    const proxy = catFileBlobProxy();
    proxy.setupFailure({
      sha: '0000000000000000000000000000000000000000',
      exitCode: 128,
      output: 'fatal: Not a valid object name 0000000000000000000000000000000000000000\n',
    });

    const result = await catFileBlob({ cwd: '/repo', sha: '0000000000000000000000000000000000000000' });

    expect(result).toBe(null);
  });

  it('ERROR: {git is not installed} => throws GitNotInstalledError', async () => {
    const proxy = catFileBlobProxy();
    proxy.setupNotFound({ sha: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4' });

    await expect(
      catFileBlob({ cwd: '/repo', sha: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4' }),
    ).rejects.toStrictEqual(
      new GitNotInstalledError(
        'git cat-file blob e3b0c44298fc1c149afbf4c8996fb92427ae41e4 could not start in /repo: "git" never started: ENOENT: open \'git\'',
      ),
    );
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the args and the actual cwd', async () => {
      const proxy = catFileBlobProxy();
      proxy.setupBlob({ sha: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4', contents: 'x' });

      await catFileBlob({
        cwd: '/repo/computed-at-runtime',
        sha: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4',
      });

      expect(
        proxy.getCallsFor({ sha: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4' }),
      ).toStrictEqual([
        [
          {
            command: 'git',
            args: ['cat-file', 'blob', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4'],
            cwd: '/repo/computed-at-runtime',
          },
        ],
      ]);
    });
  });
});
