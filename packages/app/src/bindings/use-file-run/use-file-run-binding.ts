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
 *   `output` is the CLI's console text, appended AS the run writes it rather than handed over at the
 *   end — the same report, arriving the way a terminal shows it. It is reset by `execute` and not by
 *   opening a file, so the last run's report survives while its result is read.
 *
 * USAGE:
 * const { run, loading, running, error, output, execute } = useFileRunBinding({ relPath });
 * // run is undefined until the file has been run at least once
 */
import { useCallback, useEffect, useState } from 'react';

import { assayerBridgeOnRunOutputAdapter } from '../../adapters/assayer-bridge/on-run-output/assayer-bridge-on-run-output-adapter';
import { runExecuteBroker } from '../../brokers/run/execute/run-execute-broker';
import { runFetchSavedBroker } from '../../brokers/run/fetch-saved/run-fetch-saved-broker';
import { runConsoleContract } from '../../contracts/run-console/run-console-contract';
import type { RunConsole } from '../../contracts/run-console/run-console-contract';
import type { RunResult, RelPath } from '@assayer/shared/contracts';

const EMPTY_CONSOLE = runConsoleContract.parse('');

export const useFileRunBinding = ({
  relPath,
}: {
  relPath: RelPath | null;
}): {
  run: RunResult | undefined;
  loading: boolean;
  running: boolean;
  error: Error | null;
  output: RunConsole;
  execute: () => void;
} => {
  const [run, setRun] = useState<RunResult | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [output, setOutput] = useState<RunConsole>(EMPTY_CONSOLE);

  // Subscribed for the window's lifetime, not per run: the chunks are pushed by main and would be
  // dropped by a listener that only existed between execute() and its resolution.
  useEffect(
    () =>
      assayerBridgeOnRunOutputAdapter({
        onChunk: ({ chunk }: { chunk: string }): void => {
          setOutput((previous) => runConsoleContract.parse(`${String(previous)}${chunk}`));
        },
      }),
    [],
  );

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
    // The previous run's report is cleared HERE rather than on open: a stale report sitting under a
    // fresh run would read as this run's output.
    setOutput(EMPTY_CONSOLE);
    runExecuteBroker({ relPath })
      .then(setRun)
      .catch(setError)
      .finally(() => {
        setRunning(false);
      });
  }, [relPath]);

  return { run, loading, running, error, output, execute };
};
