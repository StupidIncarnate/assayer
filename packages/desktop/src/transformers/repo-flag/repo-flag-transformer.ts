/**
 * PURPOSE: Extracts the `--repo <path>` value from an argv array (defaulting to '.') as a
 *   branded RepoPath. Used by the desktop main entry to scope the app to the invoking repo.
 *
 * USAGE:
 * repoFlagTransformer({ argv: ['--repo', '/home/user/project'] });
 * // Returns the branded RepoPath '/home/user/project'
 */

const REPO_FLAG = '--repo';

export const repoFlagTransformer = ({ argv }: { argv: readonly string[] }): string => {
  const flagIndex = argv.indexOf(REPO_FLAG);
  const provided = flagIndex >= 0 ? argv[flagIndex + 1] : undefined;

  return (provided ?? '.');
};
