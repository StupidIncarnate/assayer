/**
 * PURPOSE: Reads a git blob's raw contents by sha — the byte-exact source text a ref-to-ref
 *   diff reads without ever touching the working tree.
 *
 * USAGE:
 * await gitCatFileBroker({ repoRoot: '/repo', blobSha: 'e3b0c44298fc...' });
 * // Returns the blob's exact FileContents, unmodified
 */
import { fileContentsContract } from '../../../contracts/file-contents/file-contents-contract';
import type { FileContents } from '../../../contracts/file-contents/file-contents-contract';
import { gitExecAdapter } from '../../../adapters/git/exec/git-exec-adapter';

export const gitCatFileBroker = async ({
  repoRoot,
  blobSha,
}: {
  repoRoot: string;
  blobSha: string;
}): Promise<FileContents> => {
  const r = await gitExecAdapter({ args: ['cat-file', 'blob', blobSha], cwd: repoRoot });

  return fileContentsContract.parse(String(r.stdout));
};
