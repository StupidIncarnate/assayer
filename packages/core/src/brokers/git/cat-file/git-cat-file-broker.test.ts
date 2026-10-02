import { GitNotInstalledError } from '#gateway/bin/git';

import { gitCatFileBroker } from './git-cat-file-broker';
import { gitCatFileBrokerProxy } from './git-cat-file-broker.proxy';

const BLOB_SHA = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

describe('gitCatFileBroker', () => {
  describe('blob exists', () => {
    it('VALID: {repoRoot: "/repo", blobSha: a committed blob} => returns the exact file contents unmodified', async () => {
      const proxy = gitCatFileBrokerProxy();

      proxy.hasBlob({ blobSha: BLOB_SHA, content: 'export const x = 1;\n' });

      const result = await gitCatFileBroker({
        repoRoot: '/repo',
        blobSha: BLOB_SHA,
      });

      expect(result).toBe('export const x = 1;\n');
    });
  });

  describe('blob cannot be read', () => {
    it('EMPTY: {blobSha: a sha git rejects} => returns empty contents', async () => {
      const proxy = gitCatFileBrokerProxy();

      proxy.blobMissing({ blobSha: BLOB_SHA });

      const result = await gitCatFileBroker({ repoRoot: '/repo', blobSha: BLOB_SHA });

      expect(result).toBe('');
    });
  });

  describe('git is not installed', () => {
    it('ERROR: {git never starts} => rejects with GitNotInstalledError naming the git call', async () => {
      const proxy = gitCatFileBrokerProxy();

      proxy.gitNotInstalled({ blobSha: BLOB_SHA });

      await expect(gitCatFileBroker({ repoRoot: '/repo', blobSha: BLOB_SHA })).rejects.toStrictEqual(
        new GitNotInstalledError(
          `git cat-file blob ${BLOB_SHA} could not start in /repo: "git" never started: ENOENT: open 'git'`,
        ),
      );
    });
  });
});
