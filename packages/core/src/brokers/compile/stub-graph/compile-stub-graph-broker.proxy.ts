import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { stubIndexWriteBrokerProxy } from '../../stub-index/write/stub-index-write-broker.proxy';

export const compileStubGraphBrokerProxy = (): {
  queueBlob: ({ blob }: { blob: unknown }) => void;
  getWrittenIndex: () => unknown;
  getWrittenPath: () => unknown;
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
    getWrittenIndex: (): unknown => writeProxy.getWrittenIndex(),
    getWrittenPath: (): unknown => writeProxy.getWrittenPath(),
  };
};
