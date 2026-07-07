/**
 * PURPOSE: Immutable identifiers for the desktop preload bridge — the window key it exposes and
 *   the IPC channel the status handler answers on.
 *
 * USAGE:
 * desktopBridgeStatics.channels.status;
 * // Returns 'assayer:status'
 */
export const desktopBridgeStatics = {
  bridge: {
    key: 'assayerBridge',
  },
  channels: {
    status: 'assayer:status',
  },
} as const;
