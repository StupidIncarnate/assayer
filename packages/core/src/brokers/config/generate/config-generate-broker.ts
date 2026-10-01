/**
 * PURPOSE: Scaffolds a fresh assayer.config.json with schema defaults in the given directory —
 *   backs `assayer init` when no existing config is found.
 *
 * USAGE:
 * await configGenerateBroker({ configDir: '/repo' });
 * // Creates /repo/assayer.config.json with schema defaults and returns the parsed AssayerConfig
 */
import { assayerConfigContract } from '@assayer/shared/contracts';
import type { AssayerConfig } from '@assayer/shared/contracts';

import { writeFileCreatingParent } from '#gateway/node/fs__promises';

export const configGenerateBroker = async ({
  configDir,
}: {
  configDir: string;
}): Promise<AssayerConfig> => {
  const config = assayerConfigContract.parse({});

  await writeFileCreatingParent(`${configDir}/assayer.config.json`, JSON.stringify(config));

  return config;
};
