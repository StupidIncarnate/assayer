/**
 * PURPOSE: Immutable identifiers for the desktop preload bridge — the window key it exposes and
 *   the IPC channels the status, compiled-tree, and compiled-file handlers answer on.
 *
 * USAGE:
 * desktopBridgeStatics.channels.status;
 * // Returns 'assayer:status'
 * desktopBridgeStatics.channels.compiledTree;
 * // Returns 'assayer:compiled-tree'
 * desktopBridgeStatics.channels.compiledFile;
 * // Returns 'assayer:compiled-file'
 */
export const desktopBridgeStatics = {
  bridge: {
    key: 'assayerBridge',
  },
  channels: {
    status: 'assayer:status',
    compiledTree: 'assayer:compiled-tree',
    compiledFile: 'assayer:compiled-file',
  },
} as const;
