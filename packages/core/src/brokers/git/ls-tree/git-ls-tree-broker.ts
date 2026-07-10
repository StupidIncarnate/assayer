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
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

import { gitExecAdapter } from '../../../adapters/git/exec/git-exec-adapter';

export const gitLsTreeBroker = async ({
  repoRoot,
  ref,
}: {
  repoRoot: string;
  ref: string;
}): Promise<{ relPath: RelPath; blobSha: ErrorMessage }[]> => {
  const r = await gitExecAdapter({ args: ['ls-tree', '-r', ref], cwd: repoRoot });

  const lines = String(r.stdout)
    .split('\n')
    .filter((line) => line.length > 0);

  return lines.map((line) => {
    const tabParts = line.split('\t');
    const meta = tabParts[0] ?? '';
    const relPath = tabParts[1] ?? '';
    const sha = meta.split(' ')[2] ?? '';

    return {
      relPath: relPathContract.parse(relPath),
      // git object id branded as opaque ErrorMessage (no dedicated sha contract)
      blobSha: errorMessageContract.parse(sha),
    };
  });
};
