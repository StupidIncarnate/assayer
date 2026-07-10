/**
 * PURPOSE: Loads the assayer cache manifest for a config directory, validating it against the
 *   cache manifest contract and confirming it was produced by the expected assayer version and
 *   config hash — a stale or foreign manifest is treated as invalid so the cache gets rebuilt.
 *
 * USAGE:
 * const result = await manifestLoadBroker({
 *   configDir: '/repo',
 *   expectedAssayerVersion: '1.0.0',
 *   expectedConfigHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
 * });
 * // Returns { status: 'ok', manifest } | { status: 'missing' } | { status: 'invalid', reason }
 */
import { assayerCacheManifestContract } from '@assayer/shared/contracts';
import type { AssayerCacheManifest } from '@assayer/shared/contracts';
import { fsExistsAdapter } from '../../../adapters/fs/exists/fs-exists-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

export const manifestLoadBroker = async ({
  configDir,
  expectedAssayerVersion,
  expectedConfigHash,
}: {
  configDir: string;
  expectedAssayerVersion: string;
  expectedConfigHash: string;
}): Promise<
  | { status: 'ok'; manifest: AssayerCacheManifest }
  | { status: 'missing' }
  | { status: 'invalid'; reason: ErrorMessage }
> => {
  const manifestPath = `${configDir}/.assayer/cache/manifest.json`;

  if (!(await fsExistsAdapter({ path: manifestPath }))) {
    return { status: 'missing' };
  }

  const text = await fsReadFileAdapter({ path: manifestPath });

  try {
    const json: unknown = JSON.parse(String(text));
    const parsed = assayerCacheManifestContract.safeParse(json);

    if (!parsed.success) {
      return {
        status: 'invalid',
        reason: errorMessageContract.parse('manifest failed schema validation'),
      };
    }

    if (
      String(parsed.data.assayerVersion) !== expectedAssayerVersion ||
      String(parsed.data.configHash) !== expectedConfigHash
    ) {
      return {
        status: 'invalid',
        reason: errorMessageContract.parse('manifest configHash or assayerVersion mismatch'),
      };
    }

    return { status: 'ok', manifest: parsed.data };
  } catch (error: unknown) {
    return {
      status: 'invalid',
      reason: errorMessageContract.parse(
        error instanceof Error ? error.message : 'invalid manifest JSON',
      ),
    };
  }
};
