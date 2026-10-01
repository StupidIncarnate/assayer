/**
 * PURPOSE: Answers "is this folder inside a git working tree?" A folder outside any repository, and
 * a folder inside a repository's `.git` directory, both read as `false`. Reach for this before any
 * other git call when a caller must tell "no repository here" apart from a real git failure.
 *
 * USAGE:
 * const inside = await isInsideWorkTree({ cwd: '/repo' });
 * // Returns true when `git rev-parse --is-inside-work-tree` exits 0 and prints `true`
 */

import { gitRun } from '../git-run/git-run';

export const isInsideWorkTree = async ({ cwd }: { cwd: string }): Promise<boolean> => {
  const { exitCode, output } = await gitRun({ args: ['rev-parse', '--is-inside-work-tree'], cwd });

  return exitCode === 0 && output.trim() === 'true';
};
