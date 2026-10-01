/**
 * PURPOSE: Reads the CLI's own package.json version and returns it branded as AssayerVersion.
 *
 * USAGE:
 * await packageJsonReadBroker();
 * // Returns the branded AssayerVersion parsed from the CLI's package.json "version" field
 */
import { readFile } from '#gateway/node/fs__promises';
import { join } from '#gateway/node/path';
import { z } from '#gateway/npm/zod';
import { assayerVersionContract } from '../../../contracts/assayer-version/assayer-version-contract';

const packageJsonVersionFieldContract = z.object({ version: assayerVersionContract });

export const packageJsonReadBroker = async (): Promise<string> => {
  const packageJsonPath = join(__dirname, '../../../../package.json');
  const contents = await readFile(packageJsonPath);
  const { version } = packageJsonVersionFieldContract.parse(JSON.parse(contents));

  return version;
};
