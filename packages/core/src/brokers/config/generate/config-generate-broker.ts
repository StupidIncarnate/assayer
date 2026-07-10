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

import { fsMkdirAdapter } from '../../../adapters/fs/mkdir/fs-mkdir-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';

export const configGenerateBroker = async ({
  configDir,
}: {
  configDir: string;
}): Promise<AssayerConfig> => {
  const config = assayerConfigContract.parse({});

  await fsMkdirAdapter({ path: configDir });
  await fsWriteFileAdapter({
    path: `${configDir}/assayer.config.json`,
    content: JSON.stringify(config),
  });

  return config;
};
