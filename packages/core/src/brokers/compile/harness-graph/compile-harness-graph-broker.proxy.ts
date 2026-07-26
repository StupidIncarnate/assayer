import { cryptoSha256AdapterProxy } from '../../../adapters/crypto/sha256/crypto-sha256-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { tsMorphReadHarnessValueTypesAdapterProxy } from '../../../adapters/ts-morph/read-harness-value-types/ts-morph-read-harness-value-types-adapter.proxy';
import { typescriptLoadHarnessAdapterProxy } from '../../../adapters/typescript/load-harness/typescript-load-harness-adapter.proxy';
import { harnessIndexWriteBrokerProxy } from '../../harness-index/write/harness-index-write-broker.proxy';

export const compileHarnessGraphBrokerProxy = (): {
  queueBlob: ({ blob }: { blob: unknown }) => void;
  // The index write is atomic: the bytes go to `<namespace>.json.tmp` first and a rename moves them
  // into place, so the address a caller asks with is that tmp path.
  getWrittenIndex: ({ path }: { path: string }) => unknown;
  // Every path written, in call order. Asking WHICH path the index landed at cannot be addressed by
  // that path without assuming the answer, so a caller reads the whole list and asserts it complete.
  getWrittenPaths: () => unknown[];
} => {
  // Hashing and harness loading run REAL — the digest IS the rebuild key under test, and a stubbed load
  // would prove a declaration nobody registered. Only the blob read and the index write are mocked, at
  // their fs boundary, so the written content and tmp path can be read back.
  cryptoSha256AdapterProxy();
  typescriptLoadHarnessAdapterProxy();
  tsMorphReadHarnessValueTypesAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();
  const writeProxy = harnessIndexWriteBrokerProxy();
  writeProxy.succeeds();

  return {
    queueBlob: ({ blob }: { blob: unknown }): void => {
      readFileProxy.returns({ content: JSON.stringify(blob) });
    },
    getWrittenIndex: ({ path }: { path: string }): unknown => writeProxy.getWrittenIndex({ path }),
    getWrittenPaths: (): unknown[] => writeProxy.getWrittenPaths(),
  };
};
