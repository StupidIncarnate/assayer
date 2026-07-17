/**
 * PURPOSE: Precheck parent responder — orchestrates the three precheck layer responders in
 *   order (config-resolve, then stable-branch, then compile-run) and returns where everything else
 *   has to look. Any layer's CliExactOutputError propagates unchanged and short-circuits the
 *   remaining stages.
 *
 *   It returns BOTH directories because they are genuinely two facts and are routinely different:
 *   `configDir` holds assayer.config.json and owns `.assayer/cache`, while `root` is where the
 *   analyzed SOURCE lives — a config saying `repoRoot: './smoke-repo'` puts them a level apart.
 *   Returning only configDir made every caller re-derive the root, and a caller that skipped that
 *   step read source from the wrong tree.
 *
 *   The resolved `config` comes back for the same reason: it is already in hand here, and a caller
 *   that had to re-read it would be a second place to get it wrong.
 *
 * USAGE:
 * const { configDir, root, config } = await PrecheckRunResponder({ repoPath: '/repo' });
 * // Returns the config's directory, the resolved source root and the config itself; throws
 * // CliExactOutputError (from whichever layer failed) without running the later stages
 */
import type { AssayerConfig } from '@assayer/shared/contracts';
import type { FilePath } from '@assayer/core/contracts';
import { analyzerHashBroker, compileResolveRootBroker } from '@assayer/core/brokers';

import { ConfigResolveLayerResponder } from './config-resolve-layer-responder';
import { StableBranchLayerResponder } from './stable-branch-layer-responder';
import { CompileRunLayerResponder } from './compile-run-layer-responder';
import { analyzerRootsResolveAdapter } from '../../../adapters/analyzer-roots/resolve/analyzer-roots-resolve-adapter';

export const PrecheckRunResponder = async ({
  repoPath,
}: {
  repoPath: string;
}): Promise<{ configDir: FilePath; root: FilePath; config: AssayerConfig }> => {
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

  return {
    configDir: resolved.configDir,
    root: compileResolveRootBroker({ repoRoot: config.repoRoot, configDir: String(resolved.configDir) }),
    config,
  };
};
