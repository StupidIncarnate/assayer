import { cryptoSha256AdapterProxy } from '../../../adapters/crypto/sha256/crypto-sha256-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { typescriptLoadHarnessAdapterProxy } from '../../../adapters/typescript/load-harness/typescript-load-harness-adapter.proxy';
import { harnessIndexWriteBrokerProxy } from '../../harness-index/write/harness-index-write-broker.proxy';

export const compileHarnessGraphBrokerProxy = (): {
  queueBlob: ({ blob }: { blob: unknown }) => void;
  getWrittenIndex: () => unknown;
  getWrittenPath: () => unknown;
} => {
  // Hashing and harness loading run REAL — the digest IS the rebuild key under test, and a stubbed load
  // would prove a declaration nobody registered. Only the blob read and the index write are mocked, at
  // their fs boundary, so the written content and tmp path can be read back.
  cryptoSha256AdapterProxy();
  typescriptLoadHarnessAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();
  const writeProxy = harnessIndexWriteBrokerProxy();
  writeProxy.succeeds();

  return {
    queueBlob: ({ blob }: { blob: unknown }): void => {
      readFileProxy.returns({ content: JSON.stringify(blob) });
    },
    getWrittenIndex: (): unknown => writeProxy.getWrittenIndex(),
    getWrittenPath: (): unknown => writeProxy.getWrittenPath(),
  };
};
