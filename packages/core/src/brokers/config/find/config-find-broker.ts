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
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import { fsExistsAdapter } from '../../../adapters/fs/exists/fs-exists-adapter';
import { pathDirnameAdapter } from '../../../adapters/path/dirname/path-dirname-adapter';

export const configFindBroker = async ({
  startDir,
}: {
  startDir: string;
}): Promise<{ found: true; configDir: FilePath; configPath: FilePath } | { found: false }> => {
  const configPath = `${startDir}/assayer.config.json`;

  const exists = await fsExistsAdapter({ path: configPath });

  if (exists) {
    return {
      found: true,
      configDir: filePathContract.parse(startDir),
      configPath: filePathContract.parse(configPath),
    };
  }

  const parent = pathDirnameAdapter({ path: startDir });

  if (String(parent) === startDir) {
    return { found: false };
  }

  return configFindBroker({ startDir: String(parent) });
};
