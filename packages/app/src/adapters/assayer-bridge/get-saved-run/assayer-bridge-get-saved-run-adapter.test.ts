import { RunResultStub, RelPathStub } from '@assayer/shared/contracts';

import { assayerBridgeGetSavedRunAdapter } from './assayer-bridge-get-saved-run-adapter';
import { assayerBridgeGetSavedRunAdapterProxy } from './assayer-bridge-get-saved-run-adapter.proxy';
import { preloadBridgeStatics } from '../../../statics/preload-bridge/preload-bridge-statics';

describe('assayerBridgeGetSavedRunAdapter', () => {
  describe('a file that has been run', () => {
    it('VALID: {a saved run} => the validated run', async () => {
      const proxy = assayerBridgeGetSavedRunAdapterProxy();
      proxy.returns({ run: RunResultStub() });

      const result = await assayerBridgeGetSavedRunAdapter({ relPath: RelPathStub({ value: 'src/a.ts' }) });

      expect(result).toStrictEqual(RunResultStub());
    });
  });

  describe('a file that has not been run', () => {
    // Undefined is an ANSWER the UI renders as an empty state — never an error, and never a reason
    // to start a run.
    it('EMPTY: {never run} => undefined', async () => {
      const proxy = assayerBridgeGetSavedRunAdapterProxy();
      proxy.neverRun();

      const result = await assayerBridgeGetSavedRunAdapter({ relPath: RelPathStub({ value: 'src/a.ts' }) });

      expect(result).toBe(undefined);
    });
  });

  describe('no bridge', () => {
    it('ERROR: {preload never ran} => the shared unavailable diagnostic', async () => {
      const proxy = assayerBridgeGetSavedRunAdapterProxy();
      proxy.absent();

      await expect(assayerBridgeGetSavedRunAdapter({ relPath: RelPathStub({ value: 'src/a.ts' }) })).rejects.toThrow(
        preloadBridgeStatics.unavailableMessage,
      );
    });
  });
});
