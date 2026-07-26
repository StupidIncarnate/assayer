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
  readThrows: ({ error }: { error: Error }) => void;
} => {
  cryptoSha256AdapterProxy();
  fsExistsAdapterProxy();
  fsReadFileAdapterProxy();
  typescriptHarnessGateAdapterProxy();

  const existsHandle = registerMock({ fn: fsExistsAdapter });
  const readHandle = registerMock({ fn: fsReadFileAdapter });

  existsHandle.calledWith([]).resolves(false);

  return {
    noHarness: (): void => {
      existsHandle.calledWith([]).resolves(false);
    },
    harness: ({ source }: { source: string }): void => {
      existsHandle.calledWith([]).resolves(true);
      readHandle.calledWith([]).resolves(source);
    },
    // The harness read is deliberately unwrapped -- no try/catch -- so a filesystem rejection (ENOENT
    // and the like) propagates to the caller unmodified. This stages that rejection.
    readThrows: ({ error }: { error: Error }): void => {
      existsHandle.calledWith([]).resolves(true);
      readHandle.onceFor([]).rejects(error);
    },
  };
};
