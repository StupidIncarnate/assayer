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
 *   end — the same report, arriving the way a terminal shows it.
 *
 *   Opening a file LOADS that file's saved report into `output` and replaces whatever was there. Both
 *   halves of that matter. Loading it is what lets a reader see WHY a file failed without running it
 *   again — including a run someone did in a terminal, since the CLI saves the same bytes. Replacing
 *   is what stops the previous file's report from sitting under the newly-opened one, where it reads
 *   as this file's. A file with no saved report gets an empty console rather than a stale one, and
 *   that is also the wipe-on-edit: the report is keyed on content, so edited source finds none.
 *
 * USAGE:
 * const { run, loading, running, error, output, execute } = useFileRunBinding({ relPath });
 * // run is undefined until the file has been run at least once
 */
import { useCallback, useEffect, useState } from '#gateway/npm/react';

import { runSubscribeOutputBroker } from '../../brokers/run/subscribe-output/run-subscribe-output-broker';
import { runExecuteBroker } from '../../brokers/run/execute/run-execute-broker';
import { runFetchConsoleBroker } from '../../brokers/run/fetch-console/run-fetch-console-broker';
import { runFetchSavedBroker } from '../../brokers/run/fetch-saved/run-fetch-saved-broker';
import { runConsoleContract } from '@assayer/shared/contracts';
import type { RunConsole, RunResult, RelPath } from '@assayer/shared/contracts';

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
      runSubscribeOutputBroker({
        onChunk: ({ chunk }: { chunk: string }): void => {
          setOutput((previous) => runConsoleContract.parse(`${String(previous)}${chunk}`));
        },
      }),
    [],
  );

  useEffect(() => {
    if (relPath === null) {
      setRun(undefined);
      setOutput(EMPTY_CONSOLE);

      return;
    }

    setLoading(true);
    setError(null);
    // Cleared BEFORE the fetch, not after it: the two files' reports would otherwise overlap for as
    // long as the round trip takes, and the reader would be looking at the previous file's failures
    // under the new file's name.
    setOutput(EMPTY_CONSOLE);
    runFetchSavedBroker({ relPath })
      .then(setRun)
      .catch(setError)
      .finally(() => {
        setLoading(false);
      });
    // A missing report is not an error — it is a file nobody has run, or one edited since its last
    // run — so it resolves to the empty console rather than raising into `error`, which is reserved
    // for a run that could not happen.
    runFetchConsoleBroker({ relPath })
      .then((saved) => {
        setOutput(saved ?? EMPTY_CONSOLE);
      })
      .catch(setError);
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
