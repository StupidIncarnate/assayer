/**
 * PURPOSE: On first run (no `stableBranch` saved in config), detects candidate stable branches
 *   (main/master) and resolves one — auto-selecting when only one candidate exists, prompting
 *   interactively when both exist — then persists the choice into assayer.config.json.
 *
 * USAGE:
 * await StableBranchLayerResponder({ config, configPath, repoRoot });
 * // Returns config unchanged when stableBranch is already set, the repo isn't a git working
 * // tree, or neither main nor master exist; otherwise returns the config with stableBranch
 * // resolved and saved to disk
 */
import { gitDetectStableBranchBroker, configStableBranchSaveBroker } from '@assayer/core/brokers';
import type { FilePath } from '@assayer/core/contracts';
import { assayerConfigContract } from '@assayer/shared/contracts';
import type { AssayerConfig } from '@assayer/shared/contracts';

import { readlineStableBranchPickAdapter } from '../../../adapters/readline/stable-branch-pick/readline-stable-branch-pick-adapter';

export const StableBranchLayerResponder = async ({
  config,
  configPath,
  repoRoot,
}: {
  config: AssayerConfig;
  configPath: FilePath;
  repoRoot: string;
}): Promise<AssayerConfig> => {
  if (config.stableBranch !== undefined) {
    return config;
  }

  const detection = await gitDetectStableBranchBroker({ repoRoot });

  if (!detection.hasGitRepo) {
    return config;
  }

  if (detection.preselected === undefined) {
    return config;
  }

  const { candidates, preselected } = detection;

  const chosen =
    candidates.length === 1
      ? preselected
      : await readlineStableBranchPickAdapter({ candidates, preselected });

  const nextConfig = assayerConfigContract.parse({ ...config, stableBranch: chosen });

  return configStableBranchSaveBroker({ configPath, config: nextConfig });
};
