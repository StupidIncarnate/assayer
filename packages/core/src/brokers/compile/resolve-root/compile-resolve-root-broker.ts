/**
 * PURPOSE: Resolves a configured repo root (as authored in assayer.config.json, which may
 *   be relative) against the directory containing that config file, producing the absolute
 *   repo root the compile pipeline walks.
 *
 * USAGE:
 * compileResolveRootBroker({ repoRoot: './smoke-repo', configDir: '/repo' });
 * // Returns a validated FilePath: '/repo/smoke-repo'
 */
import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import { resolve } from '#gateway/node/path';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';

export const compileResolveRootBroker = ({
  repoRoot,
  configDir,
}: {
  repoRoot: string;
  configDir: string;
}): FilePath => filePathContract.parse(resolve(configDir, repoRoot));
