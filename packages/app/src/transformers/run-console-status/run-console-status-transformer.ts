/**
 * PURPOSE: Decides how the run console states the end of a run — running, finished, or failed.
 *
 *   `failed` is derived from the fact that a run failed, never from its message. The console reports
 *   the SHAPE of the end; the detail panel is the single place the reason is written, so nothing here
 *   can grow into a second copy of it.
 *
 *   A run in flight outranks a failure: `running` means Jest is executing right now, which is the more
 *   recent truth about a console that is still being written to.
 *
 * USAGE:
 * runConsoleStatusTransformer({ running: false, failed: true });
 * // Returns 'failed'
 */
import { runConsoleStatusContract } from '../../contracts/run-console-status/run-console-status-contract';
import type { RunConsoleStatus } from '../../contracts/run-console-status/run-console-status-contract';

export const runConsoleStatusTransformer = ({
  running,
  failed,
}: {
  running: boolean;
  failed: boolean;
}): RunConsoleStatus => {
  if (running) {
    return runConsoleStatusContract.parse('running');
  }

  if (failed) {
    return runConsoleStatusContract.parse('failed');
  }

  return runConsoleStatusContract.parse('finished');
};
