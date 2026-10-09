/**
 * PURPOSE: The one pool of live worker processes that `forkWorker` hands out and
 * `closeForkWorkers` empties. Both read the same map, so a worker that `forkWorker` pools is a
 * worker that `closeForkWorkers` can stop.
 *
 * USAGE:
 * forkWorkerPool.get(JSON.stringify([modulePath, execArgv]));
 * // Returns the live worker for that module and flags, or undefined when none is running
 */

export const forkWorkerPool = new Map<
  string,
  { request: (params: { message: unknown }) => Promise<unknown>; close: () => Promise<void> }
>();
