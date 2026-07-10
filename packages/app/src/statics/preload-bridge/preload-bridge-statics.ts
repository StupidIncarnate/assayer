/**
 * PURPOSE: Immutable copy for the assayer preload bridge — the single actionable error string
 *   every assayer-bridge adapter throws when window.assayerBridge (or the method it needs) was
 *   never exposed by the Electron preload. One source so the message stays byte-identical across
 *   getStatus / getCompiledTree / getCompiledFile.
 *
 * USAGE:
 * throw new Error(preloadBridgeStatics.unavailableMessage);
 * // Throws the shared preload-unavailable diagnostic
 */
export const preloadBridgeStatics = {
  unavailableMessage:
    'Assayer preload bridge unavailable: window.assayerBridge was not exposed by the Electron ' +
    'preload. The preload never ran contextBridge.exposeInMainWorld — verify the BrowserWindow ' +
    'sets webPreferences.sandbox=false (or the preload is bundled to a single file) and that the ' +
    'preload path resolves to a built .js.',
} as const;
