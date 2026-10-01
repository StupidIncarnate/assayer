/**
 * PURPOSE: Handles `assayer status` — formats core's status into CLI output text.
 *
 * USAGE:
 * StatusShowResponder();
 * // Returns CliOutput, e.g. "assayer 1.0.0\nAssayer core online"
 */
import { statusGetBroker } from '@assayer/core/brokers';


export const StatusShowResponder = (): string => {
  const status = statusGetBroker();

  return `assayer ${status.version}\n${status.message}`;
};
