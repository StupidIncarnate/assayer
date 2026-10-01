/**
 * PURPOSE: Deletes the assayer content-hash cache directory for a config directory — the
 *   machine-owned artifact that gets regenerated on the next analysis run. Never touches
 *   committed `.assayer/` state outside `cache/`.
 *
 * USAGE:
 * await manifestTrashBroker({ configDir: '/repo' });
 * // Removes '/repo/.assayer/cache' recursively; a missing directory is not an error
 */
import { rm } from '#gateway/node/fs__promises';

export const manifestTrashBroker = async ({
  configDir,
}: {
  configDir: string;
}): Promise<void> => rm(`${configDir}/.assayer/cache`, { recursive: true, force: true });
