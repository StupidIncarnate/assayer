/**
 * PURPOSE: Handles `assayer status` — formats core's status into CLI output text.
 *
 * USAGE:
 * StatusShowResponder();
 * // Returns CliOutput, e.g. "assayer 1.0.0\nAssayer core online"
 */
import { statusGetBroker } from '@assayer/core/brokers';

import { cliOutputContract } from '../../../contracts/cli-output/cli-output-contract';
import type { CliOutput } from '../../../contracts/cli-output/cli-output-contract';

export const StatusShowResponder = (): CliOutput => {
  const status = statusGetBroker();

  return cliOutputContract.parse(`assayer ${status.version}\n${status.message}`);
};
