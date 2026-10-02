/**
 * PURPOSE: Resolves a git ref (branch, tag, or sha) to its full commit sha inside a repo —
 *   returns undefined instead of throwing when the ref does not exist.
 *
 * USAGE:
 * await gitResolveCommitBroker({ repoRoot: '/repo', ref: 'master' });
 * // Returns the resolved 40-char commit sha, or undefined when the ref is missing.
 * // Rejects with GitNotInstalledError when git itself cannot start.
 */
import { resolveRef } from '#gateway/bin/git';

export const gitResolveCommitBroker = async ({
  repoRoot,
  ref,
}: {
  repoRoot: string;
  ref: string;
}): Promise<string | undefined> => {
  const sha = await resolveRef({ cwd: repoRoot, ref });

  // The commit sha is returned as a plain string because no sha contract exists.
  return sha ?? undefined;
};
