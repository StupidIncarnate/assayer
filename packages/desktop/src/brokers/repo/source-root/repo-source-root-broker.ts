/**
 * PURPOSE: Resolves where a target repo's analyzed SOURCE lives, given the directory its config sits
 *   in — the fact a run needs and the desktop otherwise lacks.
 *
 *   The desktop is launched with `--repo <configDir>`, which is where `.assayer/cache` lives. That is
 *   NOT necessarily where the source is: a config saying `repoRoot: './smoke-repo'` puts them a level
 *   apart, and reading source from the config dir then finds nothing. Every other desktop broker gets
 *   away with knowing only configDir because they only ever read the CACHE; a run reads the code.
 *
 * USAGE:
 * await repoSourceRootBroker({ repoPath: '/repo' });
 * // Returns '/repo/smoke-repo' when the config sets repoRoot, '/repo' when it does not
 */
import { configLoadBroker, compileResolveRootBroker } from '@assayer/core/brokers';


export const repoSourceRootBroker = async ({ repoPath }: { repoPath: string }): Promise<string> => {
  const loaded = await configLoadBroker({ configPath: `${repoPath}/assayer.config.json` });

  if (!loaded.success) {
    throw new Error(
      `assayer: cannot read ${repoPath}/assayer.config.json — ${loaded.message}. ` +
        'Run `assayer status` in that repo to generate one.',
    );
  }

  return compileResolveRootBroker({ repoRoot: String(loaded.data.repoRoot), configDir: repoPath });
};
