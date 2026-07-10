/**
 * PURPOSE: Handles `assayer version` — reads the CLI's own package.json version and formats it
 *   as CLI output.
 *
 * USAGE:
 * await VersionShowResponder();
 * // Returns CliOutput, e.g. "assayer 1.0.0"
 */
import { packageJsonReadAdapter } from '../../../adapters/package-json/read/package-json-read-adapter';

import { cliOutputContract } from '../../../contracts/cli-output/cli-output-contract';
import type { CliOutput } from '../../../contracts/cli-output/cli-output-contract';

export const VersionShowResponder = async (): Promise<CliOutput> => {
  const version = await packageJsonReadAdapter();

  return cliOutputContract.parse(`assayer ${version}`);
};
