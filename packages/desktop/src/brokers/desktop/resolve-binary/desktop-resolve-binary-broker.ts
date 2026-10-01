/**
 * PURPOSE: Resolves the Electron executable path. When `electron` is required from a plain Node
 *   launcher context (not the Electron runtime), its module export IS the binary path string.
 *
 * USAGE:
 * desktopResolveBinaryBroker();
 * // Returns the ExecutablePath to the Electron binary
 */
import electron from '#gateway/npm/electron';

export const desktopResolveBinaryBroker = (): string => {
  const binaryPath: unknown = electron;

  if (typeof binaryPath !== 'string') {
    throw new Error('Electron binary path unavailable — not running in a Node launcher context');
  }

  return binaryPath;
};
