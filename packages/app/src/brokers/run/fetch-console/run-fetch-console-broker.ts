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
import { assayerBridgeGetSavedConsoleAdapter } from '../../../adapters/assayer-bridge/get-saved-console/assayer-bridge-get-saved-console-adapter';
import type { RunConsole, RelPath } from '@assayer/shared/contracts';

export const runFetchConsoleBroker = async ({ relPath }: { relPath: RelPath }): Promise<RunConsole | undefined> =>
  assayerBridgeGetSavedConsoleAdapter({ relPath });
