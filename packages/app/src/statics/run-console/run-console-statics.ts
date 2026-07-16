/**
 * PURPOSE: Immutable display vocabulary for the run console — what the panel says while a run is in
 *   flight, once it has finished, and before the CLI has written its first byte.
 *
 *   "Finished" is stated rather than implied by the text simply ending: a report that stopped writing
 *   and a report still being written look identical, and telling them apart is the whole job.
 *
 * USAGE:
 * runConsoleStatics.status.running;
 * // Returns 'Running…'
 */
export const runConsoleStatics = {
  status: {
    running: 'Running…',
    finished: 'Finished',
  },
  waitingMessage: 'Waiting for the CLI…',
} as const;
