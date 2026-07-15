import { RunResultStub } from '@assayer/shared/contracts';

import { runFindBroker } from './run-find-broker';
import { runFindBrokerProxy } from './run-find-broker.proxy';

describe('runFindBroker', () => {
  describe('a file that has been run', () => {
    it('VALID: {a saved run for these bytes} => the run', async () => {
      const proxy = runFindBrokerProxy();
      proxy.savedRun({ run: RunResultStub() });

      const result = await runFindBroker({ configDir: '/repo', root: '/repo', relPath: 'src/a.ts' });

      expect(result).toStrictEqual(RunResultStub());
    });
  });

  describe('a file that has not been run', () => {
    // "Not run" is an answer, not an error — the UI owes an empty state, not a failure.
    it('EMPTY: {no run for these bytes} => undefined', async () => {
      const proxy = runFindBrokerProxy();
      proxy.neverRun();

      const result = await runFindBroker({ configDir: '/repo', root: '/repo', relPath: 'src/a.ts' });

      expect(result).toBe(undefined);
    });
  });

  describe('a file that is not there', () => {
    it('EMPTY: {no such file} => undefined rather than a read error', async () => {
      const proxy = runFindBrokerProxy();
      proxy.fileMissing();

      const result = await runFindBroker({ configDir: '/repo', root: '/repo', relPath: 'src/gone.ts' });

      expect(result).toBe(undefined);
    });
  });
});
