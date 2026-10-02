import { harnessLoadBrokerProxy } from '../../harness/load/harness-load-broker.proxy';
import { harnessIndexWriteBrokerProxy } from '../../harness-index/write/harness-index-write-broker.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

import { tsconfigOwnerBrokerProxy } from '../../tsconfig/owner/tsconfig-owner-broker.proxy';

export const compileHarnessGraphBrokerProxy = (): {
  queueBlob: ({ path, blob }: { path: string; blob: unknown }) => void;
  // No tsconfig owns these harness files under `root`, so their value types read under TypeScript's
  // defaults and their analysis options add only the forced `strictNullChecks` to the harness hash.
  harnessesWithoutOwner: ({ root, relPaths }: { root: string; relPaths: readonly string[] }) => void;
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
  harnessLoadBrokerProxy();
  const readFileGateway = readFileProxy();
  const writeProxy = harnessIndexWriteBrokerProxy();
  const ownerProxy = tsconfigOwnerBrokerProxy();

  return {
    queueBlob: ({ path, blob }: { path: string; blob: unknown }): void => {
      readFileGateway.returns({ path, contents: JSON.stringify(blob) });
    },
    harnessesWithoutOwner: ({ root, relPaths }: { root: string; relPaths: readonly string[] }): void => {
      ownerProxy.filesWithoutOwner({ absPaths: relPaths.map((relPath) => `${root}/${relPath}`) });
    },
    getWrittenIndex: ({ path }: { path: string }): unknown => writeProxy.getWrittenIndex({ path }),
    indexWriteSucceeds: ({ configDir, namespace }: { configDir: string; namespace: string }): void => {
      writeProxy.succeeds({ configDir, namespace });
    },
    getWrittenPaths: ({ configDir }: { configDir: string }): unknown[] => writeProxy.getWrittenPaths({ configDir }),
  };
};
