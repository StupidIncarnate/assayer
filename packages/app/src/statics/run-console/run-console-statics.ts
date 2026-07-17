/**
 * PURPOSE: Immutable display vocabulary for the run console — what the panel says while a run is in
 *   flight, once it has ended, and before the CLI has written its first byte.
 *
 *   "Finished" is stated rather than implied by the text simply ending: a report that stopped writing
 *   and a report still being written look identical, and telling them apart is the whole job.
 *
 *   The vocabulary names the run's END and never its reason. A run that could not happen is announced
 *   here as "Failed" and explained in the detail panel, which is the single surface that owns the
 *   error text — so `noOutputMessage` says where the reason is rather than repeating it.
 *
 * USAGE:
 * runConsoleStatics.status.running;
 * // Returns 'Running…'
 */
export const runConsoleStatics = {
  status: {
    running: 'Running…',
    finished: 'Finished',
    failed: 'Failed',
  },
  statusColour: {
    running: 'yellow.5',
    finished: 'gray.4',
    failed: 'red.4',
  },
  waitingMessage: 'Waiting for the CLI…',
  noOutputMessage: 'The CLI wrote nothing — the Tests panel has the reason.',
} as const;
