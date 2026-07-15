/**
 * PURPOSE: Fetches a file's LAST saved run via the preload bridge adapter. Atomic broker — the seam
 *   the detail panel calls when a file is opened.
 *
 *   It never runs anything, which is the whole distinction from `run-execute-broker`.
 *
 * USAGE:
 * await runFetchSavedBroker({ relPath });
 * // Returns the saved RunResult, or undefined when the file has never been run
 */
import { assayerBridgeGetSavedRunAdapter } from '../../../adapters/assayer-bridge/get-saved-run/assayer-bridge-get-saved-run-adapter';
import type { RunResult, RelPath } from '@assayer/shared/contracts';

export const runFetchSavedBroker = async ({ relPath }: { relPath: RelPath }): Promise<RunResult | undefined> =>
  assayerBridgeGetSavedRunAdapter({ relPath });
