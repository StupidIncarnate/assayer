import { stubIndexWriteBrokerProxy } from '../../stub-index/write/stub-index-write-broker.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

export const compileStubGraphBrokerProxy = (): {
  // `path` is the blob file the broker reads: `<blobsDir>/<contentHash>.json`. One-shot, so two blobs
  // queued for the same path are read in the order queued.
  queueBlob: ({ path, blob }: { path: string; blob: unknown }) => void;
  // The index write is atomic: the bytes go to `<namespace>.json.tmp` first and a rename moves them
  // into place, so the address a caller asks with is that tmp path.
  getWrittenIndex: ({ path }: { path: string }) => unknown;
  // Every path written, in call order. Asking WHICH path the index landed at cannot be addressed by
  // that path without assuming the answer, so a caller reads the whole list and asserts it complete.
  getWrittenPaths: () => unknown[];
} => {
  // Each queued blob is one file's on-disk record, answered to a read of its exact path. The write runs
  // through the REAL stubIndexWriteBroker with only its fs calls mocked, so the written content and tmp
  // path can be read back.
  const readFileGateway = readFileProxy();
  const writeProxy = stubIndexWriteBrokerProxy();
  writeProxy.succeeds();

  return {
    queueBlob: ({ path, blob }: { path: string; blob: unknown }): void => {
      readFileGateway.returnsOnce({ path, contents: JSON.stringify(blob) });
    },
    getWrittenIndex: ({ path }: { path: string }): unknown => writeProxy.getWrittenIndex({ path }),
    getWrittenPaths: (): unknown[] => writeProxy.getWrittenPaths(),
  };
};
