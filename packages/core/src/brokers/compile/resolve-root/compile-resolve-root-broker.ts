/**
 * PURPOSE: Resolves a configured repo root (as authored in assayer.config.json, which may
 *   be relative) against the directory containing that config file, producing the absolute
 *   repo root the compile pipeline walks.
 *
 * USAGE:
 * compileResolveRootBroker({ repoRoot: './smoke-repo', configDir: '/repo' });
 * // Returns a validated FilePath: '/repo/smoke-repo'
 */
import { pathResolveAdapter } from '../../../adapters/path/resolve/path-resolve-adapter';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const compileResolveRootBroker = ({
  repoRoot,
  configDir,
}: {
  repoRoot: string;
  configDir: string;
}): FilePath => pathResolveAdapter({ segments: [configDir, repoRoot] });
