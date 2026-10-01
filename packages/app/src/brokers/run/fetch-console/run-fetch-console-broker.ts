/**
 * PURPOSE: Fetches the report a file's LAST run wrote, via the preload bridge adapter. Atomic broker —
 *   the seam the explorer calls when a file is opened, so the run console can show what happened
 *   without anyone re-running it.
 *
 *   It never runs anything, which is the whole distinction from `run-execute-broker`.
 *
 * USAGE:
 * await runFetchConsoleBroker({ relPath });
 * // Returns the saved RunConsole, or undefined when the file has no report for its current bytes
 */
import type { RunConsole, RelPath } from '@assayer/shared/contracts';
import { window } from '#gateway/browser/window';
import { preloadBridgeStatics } from '../../../statics/preload-bridge/preload-bridge-statics';
import { runConsoleContract } from '@assayer/shared/contracts';

export const runFetchConsoleBroker = async ({ relPath }: { relPath: RelPath }): Promise<RunConsole | undefined> => {
  const bridge = window.assayerBridge;

  if (bridge?.getSavedConsole === undefined) {
    throw new Error(preloadBridgeStatics.unavailableMessage);
  }

  const raw: unknown = await bridge.getSavedConsole({ relPath: String(relPath) });

  return raw === undefined || raw === null ? undefined : runConsoleContract.parse(raw);
};
