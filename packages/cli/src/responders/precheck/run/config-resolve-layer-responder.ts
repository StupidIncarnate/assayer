/**
 * PURPOSE: Precheck layer — finds, generates, or loads assayer.config.json for a repo, throwing
 *   exact-output CLI errors for malformed JSON or schema-invalid config so the top-level precheck
 *   run responder can surface them verbatim.
 *
 * USAGE:
 * const { config, configDir, configPath } = await ConfigResolveLayerResponder({ repoPath: '/repo' });
 * // Returns the resolved AssayerConfig plus the dir/path it lives in (generating a default
 * // config when none is found); throws CliExactOutputError on malformed JSON or an invalid schema
 */
import { configResolveLayerResultContract } from '../../../contracts/config-resolve-layer-result/config-resolve-layer-result-contract';
import type { ConfigResolveLayerResult } from '../../../contracts/config-resolve-layer-result/config-resolve-layer-result-contract';
import { configFindBroker, configGenerateBroker, configLoadBroker } from '@assayer/core/brokers';

import { zodIssueListContract } from '../../../contracts/zod-issue-list/zod-issue-list-contract';
import { jsonErrorMessageFormatTransformer } from '../../../transformers/json-error-message-format/json-error-message-format-transformer';
import { zodErrorMessageFormatTransformer } from '../../../transformers/zod-error-message-format/zod-error-message-format-transformer';
import { CliExactOutputError } from '../../../errors/cli-exact-output/cli-exact-output-error';

export const ConfigResolveLayerResponder = async ({
  repoPath,
}: {
  repoPath: string;
}): Promise<ConfigResolveLayerResult> => {
  const found = await configFindBroker({ startDir: repoPath });

  if (!found.found) {
    const config = await configGenerateBroker({ configDir: repoPath });

    return configResolveLayerResultContract.parse({
      config,
      configDir: repoPath,
      configPath: `${repoPath}/assayer.config.json`,
    });
  }

  const loaded = await configLoadBroker({ configPath: found.configPath }).catch((error: unknown) => {
    const { issues } = zodIssueListContract.parse(error);

    throw new CliExactOutputError({
      message: zodErrorMessageFormatTransformer({
        issues: issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
      }),
    });
  });

  if (!loaded.success) {
    throw new CliExactOutputError({
      message: jsonErrorMessageFormatTransformer({
        fileName: 'assayer.config.json',
        message: loaded.message,
        line: loaded.line,
        column: loaded.column,
      }),
    });
  }

  return configResolveLayerResultContract.parse({ config: loaded.data, configDir: found.configDir, configPath: found.configPath });
};
