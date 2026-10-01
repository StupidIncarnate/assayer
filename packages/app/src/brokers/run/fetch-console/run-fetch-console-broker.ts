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
import { window } from '#gateway/browser/window';
import { preloadBridgeStatics } from '../../../statics/preload-bridge/preload-bridge-statics';

export const runFetchConsoleBroker = async ({ relPath }: { relPath: string }): Promise<string | undefined> => {
  const bridge = window.assayerBridge;

  if (bridge?.getSavedConsole === undefined) {
    throw new Error(preloadBridgeStatics.unavailableMessage);
  }

  const raw: unknown = await bridge.getSavedConsole({ relPath: String(relPath) });

  if (raw === undefined || raw === null) {
    return undefined;
  }

  if (typeof raw !== 'string') {
    throw new Error(`Saved run console must be a string, received ${typeof raw}`);
  }

  return raw;
};
