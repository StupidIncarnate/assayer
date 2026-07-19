/**
 * PURPOSE: Reads the nearest tsconfig to a search path with the npm `typescript` compiler API —
 *   `findConfigFile` up the tree, then `readConfigFile` + `parseJsonConfigFileContent` — and returns
 *   the resolved `CompilerOptions` the module resolver needs, a `tsconfigHash` (sha256 of the raw
 *   tsconfig bytes) that keys the derived resolved index, and the `configFilePath` the second
 *   node_modules-aware project is rooted at. When no tsconfig is found the options are empty, the hash
 *   is the empty-content digest, and no config path is returned, so resolution still runs with node
 *   defaults (and external type reading is skipped).
 *
 * USAGE:
 * typescriptReadConfigAdapter({ searchPath: '/repo' });
 * // Returns { options: ts.CompilerOptions, tsconfigHash: ContentHash, configFilePath?: FilePath }
 */
import { createHash } from 'node:crypto';
import { dirname } from 'node:path';

import ts from 'typescript';

import { contentHashContract } from '@assayer/shared/contracts';
import type { ContentHash } from '@assayer/shared/contracts';

import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const typescriptReadConfigAdapter = ({
  searchPath,
}: {
  searchPath: string;
}): { options: ts.CompilerOptions; tsconfigHash: ContentHash; configFilePath?: FilePath } => {
  const configPath = ts.findConfigFile(searchPath, (file) => ts.sys.fileExists(file), 'tsconfig.json');
  const rawText = configPath === undefined ? '' : ts.sys.readFile(configPath) ?? '';
  const tsconfigHash = contentHashContract.parse(createHash('sha256').update(rawText, 'utf8').digest('hex'));

  if (configPath === undefined) {
    return { options: {}, tsconfigHash };
  }

  const read = ts.readConfigFile(configPath, (path) => ts.sys.readFile(path));
  const parsed = ts.parseJsonConfigFileContent(read.config ?? {}, ts.sys, dirname(configPath));

  return { options: parsed.options, tsconfigHash, configFilePath: filePathContract.parse(configPath) };
};
