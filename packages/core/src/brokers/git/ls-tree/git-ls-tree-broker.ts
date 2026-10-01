/**
 * PURPOSE: Lists every blob in a git ref's tree, pairing each entry's repo-relative path with
 *   its blob sha — the raw inventory a ref-to-ref diff walks to find changed files.
 *
 * USAGE:
 * await gitLsTreeBroker({ repoRoot: '/repo', ref: 'HEAD' });
 * // Returns [{ relPath, blobSha }, ...] for every file tracked at that ref
 */
import { relPathContract } from '@assayer/shared/contracts';
import type { RelPath } from '@assayer/shared/contracts';

import { GitNotInstalledError, lsTree } from '#gateway/bin/git';

export const gitLsTreeBroker = async ({
  repoRoot,
  ref,
}: {
  repoRoot: string;
  ref: string;
}): Promise<{ relPath: RelPath; blobSha: string }[]> => {
  const entries = await lsTree({ cwd: repoRoot, ref }).catch((error: unknown) => {
    if (error instanceof GitNotInstalledError) {
      return null;
    }
    throw error;
  });

  return (entries ?? []).map((entry) => ({
    relPath: relPathContract.parse(entry.path),
    // The blob sha is a plain string because no sha contract exists.
    blobSha: entry.sha,
  }));
};
