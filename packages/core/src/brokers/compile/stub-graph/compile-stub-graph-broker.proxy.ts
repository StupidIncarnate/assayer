import { stubIndexWriteBrokerProxy } from '../../stub-index/write/stub-index-write-broker.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

export const compileStubGraphBrokerProxy = (): {
  // `path` is the blob file the broker reads: `<blobsDir>/<analysisHash>.json`. One-shot, so two blobs
  // queued for the same path are read in the order queued.
  queueBlob: ({ path, blob }: { path: string; blob: unknown }) => void;
  // The index write is atomic: the bytes go to `<namespace>.json.tmp` first and a rename moves them
  // into place, so the address a caller asks with is that tmp path.
  getWrittenIndex: ({ path }: { path: string }) => unknown;
  // Stages the mkdir -> write -> rename of `<configDir>/.assayer/cache/stubs/<namespace>.json`. A write
  // to any other path is not staged, so it throws.
  indexWriteSucceeds: ({ configDir, namespace }: { configDir: string; namespace: string }) => void;
  // Every rename of `<namespace>.json.tmp` onto `<namespace>.json` under the stubs cache directory, as
  // full argument tuples.
  getIndexRenames: ({ configDir, namespace }: { configDir: string; namespace: string }) => readonly unknown[][];
} => {
  // Each queued blob is one file's on-disk record, answered to a read of its exact path. The write runs
  // through the REAL stubIndexWriteBroker with only its fs calls mocked, so the written content and tmp
  // path can be read back.
  const readFileGateway = readFileProxy();
  const writeProxy = stubIndexWriteBrokerProxy();

  return {
    queueBlob: ({ path, blob }: { path: string; blob: unknown }): void => {
      readFileGateway.returnsOnce({ path, contents: JSON.stringify(blob) });
    },
    getWrittenIndex: ({ path }: { path: string }): unknown => writeProxy.getWrittenIndex({ path }),
    indexWriteSucceeds: ({ configDir, namespace }: { configDir: string; namespace: string }): void => {
      writeProxy.succeeds({ configDir, namespace });
    },
    getIndexRenames: ({ configDir, namespace }: { configDir: string; namespace: string }): readonly unknown[][] =>
      writeProxy.getRenameArgs({ configDir, namespace }),
  };
};
