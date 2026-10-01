import { contentHashTransformerProxy } from '../../../transformers/content-hash/content-hash-transformer.proxy';
import { harnessValueTypesTransformerProxy } from '../../../transformers/harness-value-types/harness-value-types-transformer.proxy';
import { harnessLoadBrokerProxy } from '../../harness/load/harness-load-broker.proxy';
import { harnessIndexWriteBrokerProxy } from '../../harness-index/write/harness-index-write-broker.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

export const compileHarnessGraphBrokerProxy = (): {
  queueBlob: ({ path, blob }: { path: string; blob: unknown }) => void;
  // The index write is atomic: the bytes go to `<namespace>.json.tmp` first and a rename moves them
  // into place, so the address a caller asks with is that tmp path.
  getWrittenIndex: ({ path }: { path: string }) => unknown;
  // Stages the mkdir -> write -> rename of `<configDir>/.assayer/cache/harness/<namespace>.json`. A
  // write to any other path is not staged, so it throws.
  indexWriteSucceeds: ({ configDir, namespace }: { configDir: string; namespace: string }) => void;
  // Every path written under `<configDir>/.assayer/cache/harness/`, in call order. Asking WHICH path the
  // index landed at cannot be addressed by that path without assuming the answer, so a caller reads the
  // whole list and asserts it complete.
  getWrittenPaths: ({ configDir }: { configDir: string }) => unknown[];
} => {
  // Hashing and harness loading run REAL — the digest IS the rebuild key under test, and a stubbed load
  // would prove a declaration nobody registered. Only the blob read and the index write are mocked, at
  // their fs boundary, so the written content and tmp path can be read back.
  contentHashTransformerProxy();
  harnessLoadBrokerProxy();
  harnessValueTypesTransformerProxy();
  const readFileGateway = readFileProxy();
  const writeProxy = harnessIndexWriteBrokerProxy();

  return {
    queueBlob: ({ path, blob }: { path: string; blob: unknown }): void => {
      readFileGateway.returns({ path, contents: JSON.stringify(blob) });
    },
    getWrittenIndex: ({ path }: { path: string }): unknown => writeProxy.getWrittenIndex({ path }),
    indexWriteSucceeds: ({ configDir, namespace }: { configDir: string; namespace: string }): void => {
      writeProxy.succeeds({ configDir, namespace });
    },
    getWrittenPaths: ({ configDir }: { configDir: string }): unknown[] => writeProxy.getWrittenPaths({ configDir }),
  };
};
