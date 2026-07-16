/**
 * PURPOSE: Immutable identifiers for the desktop preload bridge — the window key it exposes and
 *   the IPC channels its handlers answer on.
 *
 *   `run` and `savedRun` are separate because they are different questions: `savedRun` ASKS what a
 *   file's last run said and must never execute anything (opening a file cannot start a Jest run),
 *   while `run` executes on demand. Folding them into one "get or run" channel is how a UI ends up
 *   silently running the repo just because someone clicked a file.
 *
 *   `runOutput` is a PUSH channel, not a handler: a run answers once, but its console output arrives
 *   throughout, so the CLI's report can only reach the window as it is written by main sending to the
 *   renderer. A request/response channel could only ever deliver the report after the wait it exists
 *   to narrate.
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
    runOutput: 'assayer:run-output',
  },
} as const;
