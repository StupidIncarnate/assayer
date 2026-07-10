/**
 * PURPOSE: Reads the CLI's own package.json version and returns it branded as AssayerVersion.
 *
 * USAGE:
 * await packageJsonReadAdapter();
 * // Returns the branded AssayerVersion parsed from the CLI's package.json "version" field
 */
import { readFile } from 'fs/promises';
import { join } from 'path';
import { z } from 'zod';
import { assayerVersionContract } from '../../../contracts/assayer-version/assayer-version-contract';
import type { AssayerVersion } from '../../../contracts/assayer-version/assayer-version-contract';

const packageJsonVersionFieldContract = z.object({ version: assayerVersionContract });

export const packageJsonReadAdapter = async (): Promise<AssayerVersion> => {
  const packageJsonPath = join(__dirname, '../../../../package.json');
  const contents = await readFile(packageJsonPath, 'utf8');
  const { version } = packageJsonVersionFieldContract.parse(JSON.parse(contents));

  return version;
};
