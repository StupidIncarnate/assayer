import { registerMock } from '@dungeonmaster/testing/register-mock';

import { fsExistsAdapter } from '../../../adapters/fs/exists/fs-exists-adapter';
import { fsExistsAdapterProxy } from '../../../adapters/fs/exists/fs-exists-adapter.proxy';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { runIdBrokerProxy } from '../id/run-id-broker.proxy';

// The broker reads TWO files through one pair of adapters — the source (to derive the content-keyed
// run id) and then console.txt — so every scenario here is a QUEUE, in that order, not a single return
// value. A flat mock would answer "the source exists" for the report too and hand the source back as
// the report. The adapters are mocked rather than fs/promises underneath them because registerMock
// dispatches on the CALL STACK, and a second mock of `readFile` registered from here is never reached:
// the calling frame belongs to the adapter, which the adapter proxy already claims.
export const runConsoleFindBrokerProxy = (): {
  savedConsole: ({ console }: { console: string }) => void;
  neverRun: () => void;
  fileMissing: () => void;
  getReadArgs: () => readonly unknown[];
} => {
  fsExistsAdapterProxy();
  fsReadFileAdapterProxy();
  runIdBrokerProxy();

  const existsHandle = registerMock({ fn: fsExistsAdapter });
  const readHandle = registerMock({ fn: fsReadFileAdapter });

  existsHandle.mockResolvedValue(true);
  readHandle.mockResolvedValue('export const a = 1;\n');

  return {
    savedConsole: ({ console: consoleText }: { console: string }): void => {
      existsHandle.mockResolvedValueOnce(true);
      existsHandle.mockResolvedValueOnce(true);
      readHandle.mockResolvedValueOnce('export const a = 1;\n');
      readHandle.mockResolvedValueOnce(consoleText);
    },
    neverRun: (): void => {
      existsHandle.mockResolvedValueOnce(true);
      existsHandle.mockResolvedValueOnce(false);
      readHandle.mockResolvedValueOnce('export const a = 1;\n');
    },
    fileMissing: (): void => {
      existsHandle.mockResolvedValueOnce(false);
    },
    // Serialized rather than destructured: reading `.path` off a mock argument needs an inline
    // structural type, which brokers/ forbids. The JSON is exact and needs no assertion.
    getReadArgs: (): readonly unknown[] => readHandle.mock.calls.map((call) => JSON.stringify(call[0])),
  };
};
