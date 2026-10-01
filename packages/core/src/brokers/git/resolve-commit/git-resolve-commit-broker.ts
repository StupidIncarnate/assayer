/**
 * PURPOSE: Resolves a git ref (branch, tag, or sha) to its full commit sha inside a repo —
 *   returns undefined instead of throwing when the ref does not exist.
 *
 * USAGE:
 * await gitResolveCommitBroker({ repoRoot: '/repo', ref: 'master' });
 * // Returns the resolved 40-char commit sha, or undefined when the ref is missing
 */

import { gitExecAdapter } from '../../../adapters/git/exec/git-exec-adapter';

export const gitResolveCommitBroker = async ({
  repoRoot,
  ref,
}: {
  repoRoot: string;
  ref: string;
}): Promise<string | undefined> => {
  const r = await gitExecAdapter({ args: ['rev-parse', ref], cwd: repoRoot });

  if (r.exitCode !== 0) {
    return undefined;
  }

  // The commit sha is returned as a plain string because no sha contract exists.
  return String(r.stdout).trim();
};
