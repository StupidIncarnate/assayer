/**
 * PURPOSE: Builds a valid GitDetectStableBranchResult for tests
 *
 * USAGE:
 * GitDetectStableBranchResultStub();
 * // Returns a valid GitDetectStableBranchResult
 */

import { gitDetectStableBranchResultContract } from "./git-detect-stable-branch-result-contract";
import type { GitDetectStableBranchResult } from "./git-detect-stable-branch-result-contract";

export const GitDetectStableBranchResultStub =
  (): GitDetectStableBranchResult =>
    gitDetectStableBranchResultContract.parse({ hasGitRepo: false });
