/**
 * PURPOSE: Persists the Electron window state to the target repo's `.assayer/window-state.json`,
 *   creating the `.assayer` directory if it does not exist yet.
 *
 * USAGE:
 * await windowStateSaveBroker({ repoPath: '/path/to/repo', state: windowState });
 * // Writes .assayer/window-state.json
 */
import { writeFileCreatingParent } from '#gateway/node/fs__promises';
import { join } from '#gateway/node/path';

import { windowStateContract } from '../../../contracts/window-state/window-state-contract';
import type { WindowState } from '../../../contracts/window-state/window-state-contract';

const JSON_INDENTATION_SPACES = 2;

export const windowStateSaveBroker = async ({
  repoPath,
  state,
}: {
  repoPath: string;
  state: WindowState;
}): Promise<void> => {
  const statePath = join(repoPath, '.assayer', 'window-state.json');
  const validState = windowStateContract.parse(state);

  await writeFileCreatingParent(statePath, `${JSON.stringify(validState, null, JSON_INDENTATION_SPACES)}\n`);
};
