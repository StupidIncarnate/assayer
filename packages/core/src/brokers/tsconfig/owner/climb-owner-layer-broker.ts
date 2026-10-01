/**
 * PURPOSE: Finds the tsconfig that owns a file by climbing the folders above it, the way tsserver does: take the
 *   nearest `tsconfig.json` at or above `searchPath`, ask whether it (or a project it references) owns the file,
 *   and if not, search again from the folder above that config. Returns undefined when no config on the way up
 *   owns the file.
 *
 * USAGE:
 * climbOwnerLayerBroker({ absPath: '/repo/packages/app/src/main.ts', searchPath: '/repo/packages/app/src' });
 * // Returns { configFilePath: '/repo/packages/app/tsconfig.json', options: { strict: true } }, or undefined
 */
import { dirname } from '#gateway/node/path';
import { findTsconfig } from '#gateway/npm/typescript';
import type { CompilerOptions } from '#gateway/npm/typescript';

import { projectOwnerLayerBroker } from './project-owner-layer-broker';

export const climbOwnerLayerBroker = ({
  absPath,
  searchPath,
}: {
  absPath: string;
  searchPath: string;
}): { configFilePath: string; options: CompilerOptions } | undefined => {
  const configFilePath = findTsconfig({ searchPath });

  if (configFilePath === undefined) {
    return undefined;
  }

  const owner = projectOwnerLayerBroker({ absPath, configFilePath, seen: [] });

  if (owner !== undefined) {
    return owner;
  }

  const configFolder = dirname(configFilePath);
  const above = dirname(configFolder);

  return above === configFolder ? undefined : climbOwnerLayerBroker({ absPath, searchPath: above });
};
