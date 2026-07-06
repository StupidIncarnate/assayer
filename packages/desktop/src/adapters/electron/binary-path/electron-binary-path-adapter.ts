/**
 * PURPOSE: Resolves the Electron executable path. When `electron` is required from a plain Node
 *   launcher context (not the Electron runtime), its module export IS the binary path string.
 *
 * USAGE:
 * electronBinaryPathAdapter();
 * // Returns the ExecutablePath to the Electron binary
 */
import electron from 'electron';

import { executablePathContract } from '../../../contracts/executable-path/executable-path-contract';
import type { ExecutablePath } from '../../../contracts/executable-path/executable-path-contract';

export const electronBinaryPathAdapter = (): ExecutablePath => {
  const binaryPath: unknown = electron;

  if (typeof binaryPath !== 'string') {
    throw new Error('Electron binary path unavailable — not running in a Node launcher context');
  }

  return executablePathContract.parse(binaryPath);
};
