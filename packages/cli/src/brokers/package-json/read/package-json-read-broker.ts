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

const packageJsonVersionFieldContract = z.object({ version: z.string().min(1).brand<'PackageJsonVersionFieldVersion'>() });

export const packageJsonReadBroker = async (): Promise<string> => {
  const packageJsonPath = join(__dirname, '../../../../package.json');
  const contents = await readFile(packageJsonPath);
  const { version } = packageJsonVersionFieldContract.parse(JSON.parse(contents));

  return version;
};
