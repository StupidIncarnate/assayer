/**
 * PURPOSE: Precheck parent responder — orchestrates the three precheck layer responders in
 *   order (config-resolve, then stable-branch, then compile-run) and returns the directory
 *   containing assayer.config.json. Any layer's CliExactOutputError propagates unchanged and
 *   short-circuits the remaining stages.
 *
 * USAGE:
 * const configDir = await PrecheckRunResponder({ repoPath: '/repo' });
 * // Returns the FilePath directory containing assayer.config.json; throws CliExactOutputError
 * // (from whichever layer failed) without running the later stages
 */
import type { FilePath } from '@assayer/core/contracts';
import { analyzerHashBroker } from '@assayer/core/brokers';

import { ConfigResolveLayerResponder } from './config-resolve-layer-responder';
import { StableBranchLayerResponder } from './stable-branch-layer-responder';
import { CompileRunLayerResponder } from './compile-run-layer-responder';
import { analyzerRootsResolveAdapter } from '../../../adapters/analyzer-roots/resolve/analyzer-roots-resolve-adapter';

export const PrecheckRunResponder = async ({ repoPath }: { repoPath: string }): Promise<FilePath> => {
  const resolved = await ConfigResolveLayerResponder({ repoPath });
  const config = await StableBranchLayerResponder({
    config: resolved.config,
    configPath: resolved.configPath,
    repoRoot: repoPath,
  });
  // Cache-invalidation identity = a content hash of Assayer's OWN analyzer source, not a version
  // string. When any analysis code changes this hash changes and the stale cache is rebuilt — no
  // manual bump. (Config changes fold in separately via configHash downstream.)
  const assayerVersion = await analyzerHashBroker({ roots: analyzerRootsResolveAdapter() });

  await CompileRunLayerResponder({ config, configDir: resolved.configDir, assayerVersion });

  return resolved.configDir;
};
