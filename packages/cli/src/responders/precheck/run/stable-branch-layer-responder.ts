/**
 * PURPOSE: On first run (no `stableBranch` saved in config), detects candidate stable branches
 *   (main/master) and resolves one — auto-selecting when only one candidate exists OR when stdout
 *   is not an interactive TTY (CI / piped runs use the detected default WITHOUT prompting), and
 *   prompting interactively only when both candidates exist AND stdout is a TTY — then persists the
 *   choice into assayer.config.json.
 *
 * USAGE:
 * await StableBranchLayerResponder({ config, configPath, repoRoot });
 * // Returns config unchanged when stableBranch is already set, the repo isn't a git working
 * // tree, or neither main nor master exist; otherwise returns the config with stableBranch
 * // resolved (interactively on a TTY, else the detected default) and saved to disk
 */
import { gitDetectStableBranchBroker, configStableBranchSaveBroker } from '@assayer/core/brokers';
import type { FilePath } from '@assayer/core/contracts';
import { assayerConfigContract } from '@assayer/shared/contracts';
import type { AssayerConfig } from '@assayer/shared/contracts';

import { processStdoutIsTtyAdapter } from '../../../adapters/process-stdout/is-tty/process-stdout-is-tty-adapter';
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

  // Prompt only when there is a genuine choice AND a human is watching: multiple candidates on an
  // interactive TTY. In CI / piped / non-TTY runs, use the detected default without prompting so no
  // picker text pollutes stdout ahead of the command's own output.
  const chosen =
    candidates.length > 1 && processStdoutIsTtyAdapter()
      ? await readlineStableBranchPickAdapter({ candidates, preselected })
      : preselected;

  const nextConfig = assayerConfigContract.parse({ ...config, stableBranch: chosen });

  return configStableBranchSaveBroker({ configPath, config: nextConfig });
};
