/**
 * PURPOSE: Immutable identifiers for the desktop preload bridge — the window key it exposes and
 *   the IPC channels its handlers answer on.
 *
 *   `run` and `savedRun` are separate because they are different questions: `savedRun` ASKS what a
 *   file's last run said and must never execute anything (opening a file cannot start a Jest run),
 *   while `run` executes on demand. Folding them into one "get or run" channel is how a UI ends up
 *   silently running the repo just because someone clicked a file.
 *
 * USAGE:
 * desktopBridgeStatics.channels.status;
 * // Returns 'assayer:status'
 * desktopBridgeStatics.channels.run;
 * // Returns 'assayer:run'
 */
export const desktopBridgeStatics = {
  bridge: {
    key: 'assayerBridge',
  },
  channels: {
    status: 'assayer:status',
    compiledTree: 'assayer:compiled-tree',
    compiledFile: 'assayer:compiled-file',
    run: 'assayer:run',
    savedRun: 'assayer:saved-run',
  },
} as const;
