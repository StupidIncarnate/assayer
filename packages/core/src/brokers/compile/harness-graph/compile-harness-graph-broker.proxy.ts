import { contentHashTransformerProxy } from '../../../transformers/content-hash/content-hash-transformer.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { harnessValueTypesTransformerProxy } from '../../../transformers/harness-value-types/harness-value-types-transformer.proxy';
import { harnessLoadBrokerProxy } from '../../harness/load/harness-load-broker.proxy';
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
  contentHashTransformerProxy();
  harnessLoadBrokerProxy();
  harnessValueTypesTransformerProxy();
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
