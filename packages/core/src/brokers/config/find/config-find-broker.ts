/**
 * PURPOSE: Recursively walks up from a starting directory to locate the nearest
 *   assayer.config.json — the anchor used to resolve the repo root.
 *
 * USAGE:
 * await configFindBroker({ startDir: '/repo/packages/core/src' });
 * // Returns { found: true, configDir, configPath } when an ancestor holds assayer.config.json,
 * // or { found: false } when no assayer.config.json exists between startDir and the filesystem
 * // root.
 */
import { pathExists } from '#gateway/node/fs__promises';
import { dirname } from '#gateway/node/path';

export const configFindBroker = async ({
  startDir,
}: {
  startDir: string;
}): Promise<{ found: true; configDir: string; configPath: string } | { found: false }> => {
  const configPath = `${startDir}/assayer.config.json`;

  const exists = await pathExists(configPath);

  if (exists) {
    return {
      found: true,
      configDir: startDir,
      configPath: configPath,
    };
  }

  const parent = dirname(startDir);

  if (String(parent) === startDir) {
    return { found: false };
  }

  return configFindBroker({ startDir: String(parent) });
};
