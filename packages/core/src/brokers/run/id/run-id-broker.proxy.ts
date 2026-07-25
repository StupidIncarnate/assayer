import { registerMock } from '@dungeonmaster/testing/register-mock';

import { cryptoSha256AdapterProxy } from '../../../adapters/crypto/sha256/crypto-sha256-adapter.proxy';
import { fsExistsAdapter } from '../../../adapters/fs/exists/fs-exists-adapter';
import { fsExistsAdapterProxy } from '../../../adapters/fs/exists/fs-exists-adapter.proxy';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { typescriptHarnessGateAdapterProxy } from '../../../adapters/typescript/harness-gate/typescript-harness-gate-adapter.proxy';

// The broker looks for a colocated harness, so every scenario starts from "there is none" — the shape
// of nearly every file, and the one whose id must not move. Registered from HERE rather than shared
// with a parent proxy: registerMock dispatches on the call stack, so these handles answer the reads
// this broker makes and a parent's handles keep answering its own.
export const runIdBrokerProxy = (): {
  noHarness: () => void;
  harness: ({ source }: { source: string }) => void;
} => {
  cryptoSha256AdapterProxy();
  fsExistsAdapterProxy();
  fsReadFileAdapterProxy();
  typescriptHarnessGateAdapterProxy();

  const existsHandle = registerMock({ fn: fsExistsAdapter });
  const readHandle = registerMock({ fn: fsReadFileAdapter });

  existsHandle.mockResolvedValue(false);

  return {
    noHarness: (): void => {
      existsHandle.mockResolvedValue(false);
    },
    harness: ({ source }: { source: string }): void => {
      existsHandle.mockResolvedValue(true);
      readHandle.mockResolvedValue(source);
    },
  };
};
