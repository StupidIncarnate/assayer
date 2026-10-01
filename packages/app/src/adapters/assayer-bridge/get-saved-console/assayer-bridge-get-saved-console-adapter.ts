/**
 * PURPOSE: Reads the report a file's LAST run wrote over the preload contextBridge
 *   (window.assayerBridge) and validates the raw IPC payload into the shared RunConsole contract.
 *
 *   It never runs anything — opening a file must not start a Jest run — and it returns undefined for a
 *   file with no report for its current bytes, which is an answer the UI renders as no console rather
 *   than an error. Undefined and an EMPTY report are different facts and stay different: empty is a run
 *   that wrote nothing, undefined is a run that did not happen.
 *
 * USAGE:
 * await assayerBridgeGetSavedConsoleAdapter({ relPath });
 * // Returns the validated RunConsole, or undefined when the file has no saved report
 */
import { runConsoleContract } from '@assayer/shared/contracts';
import type { RunConsole, RelPath } from '@assayer/shared/contracts';

import { preloadBridgeStatics } from '../../../statics/preload-bridge/preload-bridge-statics';
import { window } from '#gateway/browser/window';

export const assayerBridgeGetSavedConsoleAdapter = async ({
  relPath,
}: {
  relPath: RelPath;
}): Promise<RunConsole | undefined> => {
  const bridge = window.assayerBridge;

  if (bridge?.getSavedConsole === undefined) {
    throw new Error(preloadBridgeStatics.unavailableMessage);
  }

  const raw: unknown = await bridge.getSavedConsole({ relPath: String(relPath) });

  return raw === undefined || raw === null ? undefined : runConsoleContract.parse(raw);
};
