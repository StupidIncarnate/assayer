/**
 * PURPOSE: React hook owning one file's run state — the saved run it loads on open, and the run a
 *   Run action produces.
 *
 *   Opening a file LOADS but never runs. A hook that ran on mount would turn clicking through a tree
 *   into executing the repo, so the fetch and the run are two calls here exactly as they are two IPC
 *   channels.
 *
 *   `running` is separate from `loading` because they mean different things to a reader: loading is
 *   "we are finding out what happened last time", running is "Jest is executing right now".
 *
 * USAGE:
 * const { run, loading, running, error, execute } = useFileRunBinding({ relPath });
 * // run is undefined until the file has been run at least once
 */
import { useCallback, useEffect, useState } from 'react';

import { runExecuteBroker } from '../../brokers/run/execute/run-execute-broker';
import { runFetchSavedBroker } from '../../brokers/run/fetch-saved/run-fetch-saved-broker';
import type { RunResult, RelPath } from '@assayer/shared/contracts';

export const useFileRunBinding = ({
  relPath,
}: {
  relPath: RelPath | null;
}): {
  run: RunResult | undefined;
  loading: boolean;
  running: boolean;
  error: Error | null;
  execute: () => void;
} => {
  const [run, setRun] = useState<RunResult | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (relPath === null) {
      setRun(undefined);

      return;
    }

    setLoading(true);
    setError(null);
    runFetchSavedBroker({ relPath })
      .then(setRun)
      .catch(setError)
      .finally(() => {
        setLoading(false);
      });
  }, [relPath]);

  const execute = useCallback(() => {
    if (relPath === null) {
      return;
    }

    setRunning(true);
    setError(null);
    runExecuteBroker({ relPath })
      .then(setRun)
      .catch(setError)
      .finally(() => {
        setRunning(false);
      });
  }, [relPath]);

  return { run, loading, running, error, execute };
};
