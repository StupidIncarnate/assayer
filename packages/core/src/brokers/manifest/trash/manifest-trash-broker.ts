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
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export const manifestTrashBroker = async ({
  configDir,
}: {
  configDir: string;
}): Promise<AdapterResult> => fsRmAdapter({ path: `${configDir}/.assayer/cache` });
