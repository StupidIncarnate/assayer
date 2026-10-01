/**
 * PURPOSE: Reads the assayer repo-level config file from disk and validates it against the
 *   config contract, returning either the parsed AssayerConfig or a pinpointed source position
 *   when the file contains malformed JSON.
 *
 * USAGE:
 * const result = await configLoadBroker({ configPath: '/repo/assayer.config.json' });
 * // Returns { success: true, data: AssayerConfig } or
 * // { success: false, message: string, line: LineNumber, column: ColumnNumber }
 */
import { jsonParseErrorSourcePositionTransformer } from '../../../transformers/json-parse-error-source-position/json-parse-error-source-position-transformer';
import { assayerConfigContract } from '@assayer/shared/contracts';
import type { AssayerConfig } from '@assayer/shared/contracts';
import type { SourcePosition } from '../../../contracts/source-position/source-position-contract';
import { readFile } from '#gateway/node/fs__promises';

export const configLoadBroker = async ({
  configPath,
}: {
  configPath: string;
}): Promise<
  { success: true; data: AssayerConfig } | ({ success: false; message: string } & SourcePosition)
> => {
  const text = (await readFile(configPath));

  try {
    const parsed = JSON.parse(text) as unknown;

    return { success: true, data: assayerConfigContract.parse(parsed) };
  } catch (error: unknown) {
    if (!(error instanceof SyntaxError)) {
      throw error;
    }

    const position = jsonParseErrorSourcePositionTransformer({
      message: error.message,
      text,
    });

    return { success: false, message: error.message, ...position };
  }
};
