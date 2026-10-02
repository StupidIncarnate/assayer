/**
 * PURPOSE: Reads a git blob's raw contents by sha — the byte-exact source text a ref-to-ref
 *   diff reads without ever touching the working tree.
 *
 * USAGE:
 * await gitCatFileBroker({ repoRoot: '/repo', blobSha: 'e3b0c44298fc...' });
 * // Returns the blob's exact FileContents, unmodified, or empty contents when git cannot read the
 * // blob. Rejects with GitNotInstalledError when git itself cannot start.
 */
import { catFileBlob } from '#gateway/bin/git';

export const gitCatFileBroker = async ({
  repoRoot,
  blobSha,
}: {
  repoRoot: string;
  blobSha: string;
}): Promise<string> => {
  const contents = await catFileBlob({ cwd: repoRoot, sha: blobSha });

  return contents ?? '';
};
