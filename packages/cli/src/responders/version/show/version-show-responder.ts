/**
 * PURPOSE: Handles `assayer version` — reads the CLI's own package.json version and formats it
 *   as CLI output.
 *
 * USAGE:
 * await VersionShowResponder();
 * // Returns CliOutput, e.g. "assayer 1.0.0"
 */
import { packageJsonReadBroker } from '../../../brokers/package-json/read/package-json-read-broker';


export const VersionShowResponder = async (): Promise<string> => {
  const version = await packageJsonReadBroker();

  return `assayer ${version}`;
};
