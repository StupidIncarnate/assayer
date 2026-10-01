/**
 * PURPOSE: Answers "does this ref exist locally?" for any branch, tag or sha. Reach for `resolveRef`
 * instead when the caller needs the sha the ref points at, not just whether it exists.
 *
 * USAGE:
 * const exists = await verifyRef({ cwd: '/repo', ref: 'main' });
 * // true when `git rev-parse --verify main` succeeds locally
 */

import { gitRun } from '../git-run/git-run';

export const verifyRef = async ({ cwd, ref }: { cwd: string; ref: string }): Promise<boolean> => {
  const { exitCode } = await gitRun({ args: ['rev-parse', '--verify', ref], cwd });
  return exitCode === 0;
};
