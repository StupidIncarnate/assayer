/**
 * PURPOSE: Loads and validates the persisted Electron window state from the target repo's
 *   `.assayer/window-state.json`. Falls back to default window dimensions when absent, malformed,
 *   or invalid.
 *
 * USAGE:
 * const state = await windowStateLoadBroker({ repoPath: '/path/to/repo' });
 * // Returns a validated WindowState
 */
import { readJsonFileIfExists } from '#gateway/node/fs__promises';
import { join } from '#gateway/node/path';

import { windowStateContract } from '../../../contracts/window-state/window-state-contract';
import type { WindowState } from '../../../contracts/window-state/window-state-contract';

const DEFAULT_WINDOW_STATE: WindowState = windowStateContract.parse({
  width: 1500,
  height: 800,
});

export const windowStateLoadBroker = async ({
  repoPath,
}: {
  repoPath: string;
}): Promise<WindowState> => {
  const statePath = join(repoPath, '.assayer', 'window-state.json');

  try {
    const raw = await readJsonFileIfExists(statePath);

    if (raw === null) {
      return DEFAULT_WINDOW_STATE;
    }

    const parsed = windowStateContract.safeParse(raw);

    if (!parsed.success) {
      return DEFAULT_WINDOW_STATE;
    }

    return parsed.data;
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return DEFAULT_WINDOW_STATE;
    }

    throw error;
  }
};
