import { RunResultStub, RelPathStub } from '@assayer/shared/contracts';

import { runFetchSavedBroker } from './run-fetch-saved-broker';
import { runFetchSavedBrokerProxy } from './run-fetch-saved-broker.proxy';

describe('runFetchSavedBroker', () => {
  describe('a file that has been run', () => {
    it('VALID: {a saved run} => the run', async () => {
      const proxy = runFetchSavedBrokerProxy();
      proxy.setupRun({ run: RunResultStub() });

      const result = await runFetchSavedBroker({ relPath: RelPathStub({ value: 'src/a.ts' }) });

      expect(result).toStrictEqual(RunResultStub());
    });
  });

  describe('a file that has not been run', () => {
    it('EMPTY: {never run} => undefined, which the UI renders as an empty state', async () => {
      const proxy = runFetchSavedBrokerProxy();
      proxy.neverRun();

      const result = await runFetchSavedBroker({ relPath: RelPathStub({ value: 'src/a.ts' }) });

      expect(result).toBe(undefined);
    });
  });
});
