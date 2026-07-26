import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { stubIndexWriteBrokerProxy } from '../../stub-index/write/stub-index-write-broker.proxy';

export const compileStubGraphBrokerProxy = (): {
  queueBlob: ({ blob }: { blob: unknown }) => void;
  // The index write is atomic: the bytes go to `<namespace>.json.tmp` first and a rename moves them
  // into place, so the address a caller asks with is that tmp path.
  getWrittenIndex: ({ path }: { path: string }) => unknown;
  // Every path written, in call order. Asking WHICH path the index landed at cannot be addressed by
  // that path without assuming the answer, so a caller reads the whole list and asserts it complete.
  getWrittenPaths: () => unknown[];
} => {
  // Blob loading runs through the REAL fsReadFileAdapter with only the underlying readFile mocked; each
  // queued blob is one file's on-disk record. The write runs through the REAL stubIndexWriteBroker with
  // only its fs adapters mocked, so the written content and tmp path can be read back.
  const readFileProxy = fsReadFileAdapterProxy();
  const writeProxy = stubIndexWriteBrokerProxy();
  writeProxy.succeeds();

  return {
    queueBlob: ({ blob }: { blob: unknown }): void => {
      readFileProxy.returns({ content: JSON.stringify(blob) });
    },
    getWrittenIndex: ({ path }: { path: string }): unknown => writeProxy.getWrittenIndex({ path }),
    getWrittenPaths: (): unknown[] => writeProxy.getWrittenPaths(),
  };
};
