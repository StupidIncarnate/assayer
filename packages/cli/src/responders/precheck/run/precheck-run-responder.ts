/**
 * PURPOSE: Precheck parent responder — orchestrates the three precheck layer responders in
 *   order (config-resolve, then stable-branch, then compile-run) and returns where everything else
 *   has to look. Any layer's CliExactOutputError propagates unchanged and short-circuits the
 *   remaining stages. It is also the CLI's error boundary for a missing git: the stable-branch and
 *   compile-run layers both run git, and a GitNotInstalledError from either becomes one exact P1.
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
 * // CliExactOutputError (from whichever layer failed) without running the later stages, and
 * // throws a CliExactOutputError naming the repo and the fix when git cannot start
 */
import { precheckRunResultContract } from '../../../contracts/precheck-run-result/precheck-run-result-contract';
import type { PrecheckRunResult } from '../../../contracts/precheck-run-result/precheck-run-result-contract';
import { analyzerHashBroker, compileResolveRootBroker } from '@assayer/core/brokers';
import { GitNotInstalledError } from '#gateway/bin/git';

import { ConfigResolveLayerResponder } from './config-resolve-layer-responder';
import { StableBranchLayerResponder } from './stable-branch-layer-responder';
import { CompileRunLayerResponder } from './compile-run-layer-responder';
import { analyzerRootsResolveBroker } from '../../../brokers/analyzer-roots/resolve/analyzer-roots-resolve-broker';
import { CliExactOutputError } from '../../../errors/cli-exact-output/cli-exact-output-error';

export const PrecheckRunResponder = async ({
  repoPath,
}: {
  repoPath: string;
}): Promise<PrecheckRunResult> => {
  const resolved = await ConfigResolveLayerResponder({ repoPath });

  try {
    const config = await StableBranchLayerResponder({
      config: resolved.config,
      configPath: resolved.configPath,
      repoRoot: repoPath,
    });
    // Cache-invalidation identity = a content hash of Assayer's OWN analyzer source, not a version
    // string. When any analysis code changes this hash changes and the stale cache is rebuilt — no
    // manual bump. (Config changes fold in separately via configHash downstream.)
    const assayerVersion = await analyzerHashBroker({ roots: analyzerRootsResolveBroker() });

    await CompileRunLayerResponder({ config, configDir: resolved.configDir, assayerVersion });

    return precheckRunResultContract.parse({
      configDir: resolved.configDir,
      root: compileResolveRootBroker({ repoRoot: config.repoRoot, configDir: String(resolved.configDir) }),
      config,
    });
  } catch (error: unknown) {
    // Every compile needs git: the current branch's name is the working tree's cache namespace,
    // and the stable branch is read from its commits. A guessed namespace would file the cache under
    // the wrong name, so a missing git stops the run here.
    if (error instanceof GitNotInstalledError) {
      throw new CliExactOutputError({
        message:
          `assayer: git is not installed or not on PATH, so Assayer cannot read the repository at ${repoPath}.\n\n` +
          'Assayer runs git to name the cache after the current branch and to read the stable branch for ref-to-ref diffs.\n' +
          'Install git, check that `git --version` works in this shell, then run this command again.\n' +
          `The git call that failed: ${error.message}`,
      });
    }

    throw error;
  }
};
