import { RunResultStub } from '@assayer/shared/contracts';

import { runLoadBroker } from './run-load-broker';
import { runLoadBrokerProxy } from './run-load-broker.proxy';

describe('runLoadBroker', () => {
  describe('a saved run', () => {
    it('VALID: {a run on disk} => the parsed run', async () => {
      const proxy = runLoadBrokerProxy();
      proxy.savedRun({ run: RunResultStub({ runId: 'abc123' }) });

      const result = await runLoadBroker({ configDir: '/repo', runId: 'abc123' });

      expect(result).toStrictEqual(RunResultStub({ runId: 'abc123' }));
    });
  });

  describe('an unknown run id', () => {
    // Undefined, not a throw: "no such run" is an answer, and only the caller knows how to say it —
    // the CLI owes a message naming the id, the UI owes an empty state.
    it('EMPTY: {no run with that id} => undefined', async () => {
      const proxy = runLoadBrokerProxy();
      proxy.noSuchRun();

      const result = await runLoadBroker({ configDir: '/repo', runId: 'nope' });

      expect(result).toBe(undefined);
    });
  });

  describe('a saved run that cannot be read', () => {
    it('ERROR: {runId: run.json exists but fsReadFileAdapter rejects with EACCES} => propagates the filesystem error unmodified, since the read is never wrapped in try/catch', async () => {
      const proxy = runLoadBrokerProxy();
      proxy.readThrows({ error: new Error('EACCES: permission denied') });

      await expect(runLoadBroker({ configDir: '/repo', runId: 'abc123' })).rejects.toThrow(
        /^EACCES: permission denied$/u,
      );
    });
  });
});
