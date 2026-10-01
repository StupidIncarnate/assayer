/**
 * PURPOSE: Deletes the assayer content-hash cache directory for a config directory — the
 *   machine-owned artifact that gets regenerated on the next analysis run. Never touches
 *   committed `.assayer/` state outside `cache/`.
 *
 * USAGE:
 * await manifestTrashBroker({ configDir: '/repo' });
 * // Removes '/repo/.assayer/cache' recursively and returns { success: true }
 */
import { fsRmAdapter } from '../../../adapters/fs/rm/fs-rm-adapter';

export const manifestTrashBroker = async ({
  configDir,
}: {
  configDir: string;
}): Promise<void> => fsRmAdapter({ path: `${configDir}/.assayer/cache` });
