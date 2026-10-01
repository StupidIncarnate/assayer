/**
 * PURPOSE: Curated surface for the `git` binary. Every function is built on
 * `#gateway/node/child_process`'s `run` and throws `GitNotInstalledError` when git itself is
 * missing, rather than letting that collapse into an ordinary command failure.
 *
 * USAGE:
 * import { lsTree, catFileBlob, GitNotInstalledError } from '#gateway/bin/git';
 */

export { branchList } from './branch-list/branch-list';
export { catFileBlob } from './cat-file-blob/cat-file-blob';
export { currentBranch } from './current-branch/current-branch';
export { GitNotInstalledError } from './git-run/git-not-installed.error';
export { gitRun } from './git-run/git-run';
export { headSha } from './head-sha/head-sha';
export { isInsideWorkTree } from './is-inside-work-tree/is-inside-work-tree';
export { lsTree } from './ls-tree/ls-tree';
export { resolveRef } from './resolve-ref/resolve-ref';
export { verifyRef } from './verify-ref/verify-ref';
