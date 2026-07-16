import { RunConsoleStub } from '../../../contracts/run-console/run-console.stub';

import { assayerBridgeOnRunOutputAdapter } from './assayer-bridge-on-run-output-adapter';
import { assayerBridgeOnRunOutputAdapterProxy } from './assayer-bridge-on-run-output-adapter.proxy';

describe('assayerBridgeOnRunOutputAdapter', () => {
  describe('a subscription over the bridge', () => {
    it('VALID: {the CLI writes a chunk} => the chunk reaches the subscriber', () => {
      const proxy = assayerBridgeOnRunOutputAdapterProxy();
      const seen: ReturnType<typeof RunConsoleStub>[] = [];

      assayerBridgeOnRunOutputAdapter({
        onChunk: ({ chunk }: { chunk: string }): void => {
          seen.push(RunConsoleStub({ value: chunk }));
        },
      });
      proxy.emit({ chunk: 'Assayer is updating caches\n' });

      expect(seen.map((entry) => String(entry))).toStrictEqual(['Assayer is updating caches\n']);
    });

    // The panel rebuilds the CLI's report by appending, so every chunk must arrive in the order the
    // child wrote it — a subscriber that saw only the last would show a report missing its start.
    it('VALID: {several chunks} => each arrives in write order', () => {
      const proxy = assayerBridgeOnRunOutputAdapterProxy();
      const seen: ReturnType<typeof RunConsoleStub>[] = [];

      assayerBridgeOnRunOutputAdapter({
        onChunk: ({ chunk }: { chunk: string }): void => {
          seen.push(RunConsoleStub({ value: chunk }));
        },
      });
      proxy.emit({ chunk: 'compiling 1/2\n' });
      proxy.emit({ chunk: 'a.ts  3/3 passed\n' });

      expect(seen.map((entry) => String(entry))).toStrictEqual(['compiling 1/2\n', 'a.ts  3/3 passed\n']);
    });

    it('VALID: {the returned unsubscribe is called} => the bridge subscription is torn down', () => {
      const proxy = assayerBridgeOnRunOutputAdapterProxy();

      assayerBridgeOnRunOutputAdapter({ onChunk: (): void => undefined })();

      expect(proxy.hasUnsubscribed()).toBe(true);
    });
  });

  describe('a missing preload bridge', () => {
    // Unlike runFile, this one is not answering a question the caller asked — it narrates a run that
    // cannot happen here anyway. Throwing would take down a window whose real problem `runFile`
    // already reports with the actionable message.
    it('EMPTY: {no bridge} => a no-op unsubscribe that throws nothing and touches no bridge', () => {
      const proxy = assayerBridgeOnRunOutputAdapterProxy();
      proxy.absent();

      // Subscribing AND tearing down are both exercised here: either one throwing would take the
      // window down — on mount, or on unmount — where the run simply cannot happen anyway.
      assayerBridgeOnRunOutputAdapter({ onChunk: (): void => undefined })();

      expect(proxy.hasUnsubscribed()).toBe(false);
    });
  });
});
