/**
 * PURPOSE: Stops every worker `forkWorker` has pooled and empties the pool. Reach for this when a
 * process that is about to finish should leave no warm worker behind, such as the end of a test
 * file. A long-running caller never needs it, because an idle worker never keeps that caller alive.
 *
 * USAGE:
 * await closeForkWorkers();
 * // Resolves once every pooled worker has exited. The next `forkWorker` call forks a fresh one.
 */

import { forkWorkerPool } from '../fork-worker/fork-worker-pool';

export const closeForkWorkers = async (): Promise<void> => {
  await Promise.all([...forkWorkerPool.values()].map(async (worker) => worker.close()));
};
