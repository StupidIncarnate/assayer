/**
 * PURPOSE: Reads a git blob's raw contents by sha — the byte-exact source text a ref-to-ref
 *   diff reads without ever touching the working tree.
 *
 * USAGE:
 * await gitCatFileBroker({ repoRoot: '/repo', blobSha: 'e3b0c44298fc...' });
 * // Returns the blob's exact FileContents, unmodified, or empty contents when the blob cannot be read
 * // or git is not installed
 */
import { fileContentsContract } from '../../../contracts/file-contents/file-contents-contract';
import type { FileContents } from '../../../contracts/file-contents/file-contents-contract';
import { catFileBlob, GitNotInstalledError } from '#gateway/bin/git';

export const gitCatFileBroker = async ({
  repoRoot,
  blobSha,
}: {
  repoRoot: string;
  blobSha: string;
}): Promise<FileContents> => {
  try {
    const contents = await catFileBlob({ cwd: repoRoot, sha: blobSha });

    return fileContentsContract.parse(contents ?? '');
  } catch (error: unknown) {
    if (error instanceof GitNotInstalledError) {
      return fileContentsContract.parse('');
    }

    throw error;
  }
};
