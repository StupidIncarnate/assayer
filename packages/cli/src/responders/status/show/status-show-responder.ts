/**
 * PURPOSE: Handles `assayer status` — formats the core status into CLI output text.
 *
 * USAGE:
 * StatusShowResponder();
 * // Returns CliOutput, e.g. "assayer 1.0.0\nAssayer core online"
 */
import { assayerCoreStatusAdapter } from '../../../adapters/assayer-core/status/assayer-core-status-adapter';
import { cliOutputContract } from '../../../contracts/cli-output/cli-output-contract';
import type { CliOutput } from '../../../contracts/cli-output/cli-output-contract';

export const StatusShowResponder = (): CliOutput => {
  const status = assayerCoreStatusAdapter();

  return cliOutputContract.parse(`assayer ${status.version}\n${status.message}`);
};
