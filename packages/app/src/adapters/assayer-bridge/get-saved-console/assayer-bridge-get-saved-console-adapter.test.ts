import { RunConsoleStub, RelPathStub } from '@assayer/shared/contracts';

import { assayerBridgeGetSavedConsoleAdapter } from './assayer-bridge-get-saved-console-adapter';
import { assayerBridgeGetSavedConsoleAdapterProxy } from './assayer-bridge-get-saved-console-adapter.proxy';
import { preloadBridgeStatics } from '../../../statics/preload-bridge/preload-bridge-statics';

describe('assayerBridgeGetSavedConsoleAdapter', () => {
  describe('a file whose last run left a report', () => {
    it('VALID: {a saved report} => the validated report', async () => {
      const proxy = assayerBridgeGetSavedConsoleAdapterProxy();
      proxy.returns({ console: RunConsoleStub() });

      const result = await assayerBridgeGetSavedConsoleAdapter({ relPath: RelPathStub({ value: 'src/a.ts' }) });

      expect(String(result)).toBe('src/a.ts  1/1 passed\n');
    });
  });

  describe('a file with no report for its current bytes', () => {
    // Undefined is an ANSWER the UI renders as no console at all — never an error, and never a reason
    // to start a run. It is what an edited file gets, since the report is keyed on content.
    it('EMPTY: {no saved report} => undefined', async () => {
      const proxy = assayerBridgeGetSavedConsoleAdapterProxy();
      proxy.neverRun();

      const result = await assayerBridgeGetSavedConsoleAdapter({ relPath: RelPathStub({ value: 'src/a.ts' }) });

      expect(result).toBe(undefined);
    });

    // An EMPTY report is a run that wrote nothing, not a run that never happened — the two must not
    // collapse, or a file that ran silently becomes indistinguishable from one nobody has run.
    it('EDGE: {an empty saved report} => the empty report, not undefined', async () => {
      const proxy = assayerBridgeGetSavedConsoleAdapterProxy();
      proxy.returns({ console: RunConsoleStub({ value: '' }) });

      const result = await assayerBridgeGetSavedConsoleAdapter({ relPath: RelPathStub({ value: 'src/a.ts' }) });

      expect(String(result)).toBe('');
    });
  });

  describe('no bridge', () => {
    it('ERROR: {preload never ran} => the shared unavailable diagnostic', async () => {
      const proxy = assayerBridgeGetSavedConsoleAdapterProxy();
      proxy.absent();

      await expect(
        assayerBridgeGetSavedConsoleAdapter({ relPath: RelPathStub({ value: 'src/a.ts' }) }),
      ).rejects.toThrow(preloadBridgeStatics.unavailableMessage);
    });
  });
});
