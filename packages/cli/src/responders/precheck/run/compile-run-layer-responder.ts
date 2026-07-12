/**
 * PURPOSE: Precheck layer — hashes the config, loads the cache manifest (trashing it when
 *   corrupt), runs the compile with a live progress renderer, and throws an exact-output CLI
 *   error naming every location if the compile reports errors.
 *
 * USAGE:
 * await CompileRunLayerResponder({ config, configDir, assayerVersion });
 * // Resolves when the compile succeeds (cache manifest written by compileRunBroker); throws
 * // CliExactOutputError with one "relPath:line:column message" line per error otherwise
 */
import { configHashBroker, manifestLoadBroker, manifestTrashBroker, compileRunBroker } from '@assayer/core/brokers';
import type { FilePath } from '@assayer/core/contracts';
import type { AssayerConfig } from '@assayer/shared/contracts';

import type { AssayerVersion } from '../../../contracts/assayer-version/assayer-version-contract';
import { processStdoutCompileProgressAdapter } from '../../../adapters/process-stdout/compile-progress/process-stdout-compile-progress-adapter';
import { compileErrorMessageFormatTransformer } from '../../../transformers/compile-error-message-format/compile-error-message-format-transformer';
import { CliExactOutputError } from '../../../errors/cli-exact-output/cli-exact-output-error';

export const CompileRunLayerResponder = async ({
  config,
  configDir,
  assayerVersion,
}: {
  config: AssayerConfig;
  configDir: FilePath;
  assayerVersion: AssayerVersion;
}): Promise<undefined> => {
  const configHash = configHashBroker({ config });
  const loaded = await manifestLoadBroker({
    configDir,
    expectedAssayerVersion: assayerVersion,
    expectedConfigHash: configHash,
  });

  if (loaded.status === 'invalid') {
    await manifestTrashBroker({ configDir });
  }

  const previousManifest = loaded.status === 'ok' ? loaded.manifest : undefined;
  const progress = processStdoutCompileProgressAdapter();

  const result = await compileRunBroker({
    configDir,
    config,
    assayerVersion,
    configHash,
    ...(previousManifest === undefined ? {} : { previousManifest }),
    onProgress: (event) => {
      progress.render({ event });
    },
  });

  if (result.status === 'errors') {
    throw new CliExactOutputError({ message: compileErrorMessageFormatTransformer({ errors: result.errors }) });
  }

  return undefined;
};
