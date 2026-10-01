import { RunResultStub } from '@assayer/shared/contracts/run-result/run-result.stub';
import { RunConsoleStub } from '@assayer/shared/contracts/run-console/run-console.stub';

import { useFileRunBinding } from './use-file-run-binding';
import { useFileRunBindingProxy } from './use-file-run-binding.proxy';
import { renderHook, waitFor } from '#gateway/npm/testing-library__react';

describe('useFileRunBinding', () => {
  describe('opening a file', () => {
    // LOADS, never runs. A hook that ran on mount would turn clicking through the tree into
    // executing the repo.
    it('VALID: {a file with a saved run} => the saved run, without running anything', async () => {
      const proxy = useFileRunBindingProxy();
      const run = RunResultStub();
      proxy.setupSavedRun({ run });
      proxy.runFails({ message: 'opening a file must never run it' });

      const { result } = renderHook(() => useFileRunBinding({ relPath: 'src/a.ts' }));
      const currentState = (): ReturnType<typeof useFileRunBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      expect(currentState().run).toStrictEqual(run);
    });

    it('EMPTY: {a file never run} => run stays undefined, with no error', async () => {
      const proxy = useFileRunBindingProxy();
      proxy.neverRun();

      const { result } = renderHook(() => useFileRunBinding({ relPath: 'src/a.ts' }));
      const currentState = (): ReturnType<typeof useFileRunBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      expect({ run: currentState().run, error: currentState().error }).toStrictEqual({ run: undefined, error: null });
    });

    it('EMPTY: {no file selected} => nothing is fetched and run stays undefined', () => {
      useFileRunBindingProxy();

      const { result } = renderHook(() => useFileRunBinding({ relPath: null }));

      expect(result.current.run).toBe(undefined);
    });

    // The payoff: the report from the LAST run arrives on open, so a reader sees why a file failed
    // without running it again — including a run someone did in a terminal, since the CLI saves the
    // same bytes the console shows.
    it('VALID: {a file whose last run left a report} => the report is loaded into output, without running', async () => {
      const proxy = useFileRunBindingProxy();
      proxy.setupSavedRun({ run: RunResultStub() });
      proxy.setupSavedConsole({
        console: RunConsoleStub({ value: 'src/a.ts  0/1 passed\n  ERROR mapEach("oops")\n' }),
      });
      proxy.runFails({ message: 'opening a file must never run it' });

      const { result } = renderHook(() => useFileRunBinding({ relPath: 'src/a.ts' }));
      const currentState = (): ReturnType<typeof useFileRunBinding> => result.current;

      await waitFor(() => {
        expect(String(currentState().output)).toBe('src/a.ts  0/1 passed\n  ERROR mapEach("oops")\n');
      });

      expect(currentState().error).toBe(null);
    });

    // The wipe. A file with no report for its CURRENT bytes gets an empty console — never the previous
    // file's report, and never its own from before an edit. A missing report is an answer, so it must
    // not raise into `error`, which is reserved for a run that could not happen.
    it('EMPTY: {a file with no saved report} => output is empty, with no error', async () => {
      const proxy = useFileRunBindingProxy();
      proxy.neverRun();

      const { result } = renderHook(() => useFileRunBinding({ relPath: 'src/a.ts' }));
      const currentState = (): ReturnType<typeof useFileRunBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      expect({ output: String(currentState().output), error: currentState().error }).toStrictEqual({
        output: '',
        error: null,
      });
    });
  });

  describe('running a file', () => {
    it('VALID: {execute} => replaces the saved run with the new one', async () => {
      const proxy = useFileRunBindingProxy();
      proxy.neverRun();
      const fresh = RunResultStub({ runId: 'fresh' });
      proxy.setupRunResult({ run: fresh });

      const { result } = renderHook(() => useFileRunBinding({ relPath: 'src/a.ts' }));
      const currentState = (): ReturnType<typeof useFileRunBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      currentState().execute();

      await waitFor(() => {
        expect(currentState().running).toBe(false);
      });

      expect(currentState().run).toStrictEqual(fresh);
    });

    // The run could not happen at all — a different thing from a failing case, and the reader needs
    // the reason.
    it('ERROR: {the run could not happen} => the error surfaces', async () => {
      const proxy = useFileRunBindingProxy();
      proxy.neverRun();
      proxy.runFails({ message: 'assayer: the CLI is not built, so nothing can be run.' });

      const { result } = renderHook(() => useFileRunBinding({ relPath: 'src/a.ts' }));
      const currentState = (): ReturnType<typeof useFileRunBinding> => result.current;

      await waitFor(() => {
        expect(currentState().loading).toBe(false);
      });

      currentState().execute();

      await waitFor(() => {
        expect(currentState().running).toBe(false);
      });

      expect(currentState().error?.message).toBe('assayer: the CLI is not built, so nothing can be run.');
    });
  });
});
