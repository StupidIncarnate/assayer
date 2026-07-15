import { RunResultStub, RelPathStub } from '@assayer/shared/contracts';

import { testingLibraryRenderHookAdapter } from '../../adapters/testing-library/render-hook/testing-library-render-hook-adapter';
import { testingLibraryWaitForAdapter } from '../../adapters/testing-library/wait-for/testing-library-wait-for-adapter';
import { useFileRunBinding } from './use-file-run-binding';
import { useFileRunBindingProxy } from './use-file-run-binding.proxy';

describe('useFileRunBinding', () => {
  describe('opening a file', () => {
    // LOADS, never runs. A hook that ran on mount would turn clicking through the tree into
    // executing the repo.
    it('VALID: {a file with a saved run} => the saved run, without running anything', async () => {
      const proxy = useFileRunBindingProxy();
      const run = RunResultStub();
      proxy.setupSavedRun({ run });
      proxy.runFails({ message: 'opening a file must never run it' });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useFileRunBinding({ relPath: RelPathStub({ value: 'src/a.ts' }) }),
      });
      const currentState = (): ReturnType<typeof useFileRunBinding> => result.current;

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(currentState().loading).toBe(false);
        },
      });

      expect(currentState().run).toStrictEqual(run);
    });

    it('EMPTY: {a file never run} => run stays undefined, with no error', async () => {
      const proxy = useFileRunBindingProxy();
      proxy.neverRun();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useFileRunBinding({ relPath: RelPathStub({ value: 'src/a.ts' }) }),
      });
      const currentState = (): ReturnType<typeof useFileRunBinding> => result.current;

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(currentState().loading).toBe(false);
        },
      });

      expect({ run: currentState().run, error: currentState().error }).toStrictEqual({ run: undefined, error: null });
    });

    it('EMPTY: {no file selected} => nothing is fetched and run stays undefined', () => {
      useFileRunBindingProxy();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useFileRunBinding({ relPath: null }),
      });

      expect(result.current.run).toBe(undefined);
    });
  });

  describe('running a file', () => {
    it('VALID: {execute} => replaces the saved run with the new one', async () => {
      const proxy = useFileRunBindingProxy();
      proxy.neverRun();
      const fresh = RunResultStub({ runId: 'fresh' });
      proxy.setupRunResult({ run: fresh });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useFileRunBinding({ relPath: RelPathStub({ value: 'src/a.ts' }) }),
      });
      const currentState = (): ReturnType<typeof useFileRunBinding> => result.current;

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(currentState().loading).toBe(false);
        },
      });

      currentState().execute();

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(currentState().running).toBe(false);
        },
      });

      expect(currentState().run).toStrictEqual(fresh);
    });

    // The run could not happen at all — a different thing from a failing case, and the reader needs
    // the reason.
    it('ERROR: {the run could not happen} => the error surfaces', async () => {
      const proxy = useFileRunBindingProxy();
      proxy.neverRun();
      proxy.runFails({ message: 'assayer: the CLI is not built, so nothing can be run.' });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useFileRunBinding({ relPath: RelPathStub({ value: 'src/a.ts' }) }),
      });
      const currentState = (): ReturnType<typeof useFileRunBinding> => result.current;

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(currentState().loading).toBe(false);
        },
      });

      currentState().execute();

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(currentState().running).toBe(false);
        },
      });

      expect(currentState().error?.message).toBe('assayer: the CLI is not built, so nothing can be run.');
    });
  });
});
