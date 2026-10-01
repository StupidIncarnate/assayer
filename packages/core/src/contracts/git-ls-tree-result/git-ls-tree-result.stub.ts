/**
 * PURPOSE: Builds a valid GitLsTreeResult for tests
 *
 * USAGE:
 * GitLsTreeResultStub();
 * // Returns a valid GitLsTreeResult
 */

import { gitLsTreeResultContract } from "./git-ls-tree-result-contract";
import type { GitLsTreeResult } from "./git-ls-tree-result-contract";

export const GitLsTreeResultStub = (): GitLsTreeResult =>
  gitLsTreeResultContract.parse([]);
