import { RunConsoleStub } from '@assayer/shared/contracts/run-console/run-console.stub';
import { RelPathStub } from '@assayer/shared/contracts/rel-path/rel-path.stub';

import { runFetchConsoleBroker } from './run-fetch-console-broker';
import { runFetchConsoleBrokerProxy } from './run-fetch-console-broker.proxy';

describe('runFetchConsoleBroker', () => {
  describe('a file whose last run left a report', () => {
    it('VALID: {a saved report} => the report', async () => {
      const proxy = runFetchConsoleBrokerProxy();
      proxy.setupConsole({ console: RunConsoleStub({ value: 'src/a.ts  0/1 passed\n' }) });

      const result = await runFetchConsoleBroker({ relPath: RelPathStub({ value: 'src/a.ts' }) });

      expect(String(result)).toBe('src/a.ts  0/1 passed\n');
    });
  });

  describe('a file with no report for its current bytes', () => {
    // Undefined is what tells the explorer to show NO console — for a file nobody has run, and for one
    // whose bytes have moved on since its last run.
    it('EMPTY: {no saved report} => undefined, which the UI renders as no console', async () => {
      const proxy = runFetchConsoleBrokerProxy();
      proxy.neverRun();

      const result = await runFetchConsoleBroker({ relPath: RelPathStub({ value: 'src/a.ts' }) });

      expect(result).toBe(undefined);
    });
  });
});
