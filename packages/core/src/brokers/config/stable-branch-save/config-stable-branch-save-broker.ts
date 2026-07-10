/**
 * PURPOSE: Persists an AssayerConfig to the repo-level config file on disk, re-validating
 *   through the config contract before writing so a caller-mutated stableBranch (or any other
 *   field) is written back in its canonical, branded form.
 *
 * USAGE:
 * await configStableBranchSaveBroker({ configPath: '/repo/assayer.config.json', config });
 * // Writes the validated config as JSON to configPath and returns the validated AssayerConfig
 */
import { assayerConfigContract } from '@assayer/shared/contracts';
import type { AssayerConfig } from '@assayer/shared/contracts';

import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';

export const configStableBranchSaveBroker = async ({
  configPath,
  config,
}: {
  configPath: string;
  config: AssayerConfig;
}): Promise<AssayerConfig> => {
  const parsed = assayerConfigContract.parse(config);

  await fsWriteFileAdapter({ path: configPath, content: JSON.stringify(parsed) });

  return parsed;
};
