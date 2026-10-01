/**
 * PURPOSE: Reads the nearest tsconfig to a search path through the typescript gateway's
 *   `readNearestTsconfig`, and returns the resolved `CompilerOptions` the module resolver needs, a
 *   `tsconfigHash` (sha256 of the raw tsconfig bytes) that keys the derived resolved index, and the
 *   `configFilePath` the second node_modules-aware project is rooted at. When no tsconfig is found the
 *   options are empty, the hash is the empty-content digest, and no config path is returned, so
 *   resolution still runs with node defaults (and external type reading is skipped).
 *
 * USAGE:
 * tsconfigReadBroker({ searchPath: '/repo' });
 * // Returns { options: ts.CompilerOptions, tsconfigHash: ContentHash, configFilePath?: FilePath }
 */
import { createHash } from '#gateway/node/crypto';

import { readNearestTsconfig } from '#gateway/npm/typescript';
import type { CompilerOptions } from '#gateway/npm/typescript';

import { contentHashContract } from '@assayer/shared/contracts';
import type { ContentHash } from '@assayer/shared/contracts';

export const tsconfigReadBroker = ({
  searchPath,
}: {
  searchPath: string;
}): { options: CompilerOptions; tsconfigHash: ContentHash; configFilePath?: string } => {
  const tsconfig = readNearestTsconfig({ searchPath });
  const tsconfigHash = contentHashContract.parse(
    createHash('sha256')
      .update(tsconfig === undefined ? '' : tsconfig.text, 'utf8')
      .digest('hex'),
  );

  if (tsconfig === undefined) {
    return { options: {}, tsconfigHash };
  }

  return { options: tsconfig.options, tsconfigHash, configFilePath: tsconfig.configFilePath };
};
