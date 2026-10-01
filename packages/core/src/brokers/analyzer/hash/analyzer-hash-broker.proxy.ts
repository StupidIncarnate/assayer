import { compileWalkWorkingTreeBrokerProxy } from '../../compile/walk-working-tree/compile-walk-working-tree-broker.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

export const analyzerHashBrokerProxy = (): {
  dirHolds: ({
    path,
    entries,
  }: {
    path: string;
    entries: readonly { name: string; kind: 'file' | 'directory' }[];
  }) => void;
  fileContent: ({ path, content }: { path: string; content: string }) => void;
  // The read is deliberately unwrapped -- no try/catch -- so a filesystem rejection (ENOENT and
  // the like) propagates to the caller unmodified. This stages an EACCES rejection for one path.
  readDenied: ({ path }: { path: string }) => void;
} => {
  // The walk runs real. Each directory it reads is staged by its exact path, so a directory no
  // scenario staged reaches an unstaged read, which throws.
  const walkProxy = compileWalkWorkingTreeBrokerProxy();
  const readFileGateway = readFileProxy();

  return {
    // Restaging a directory replaces its entries for every later walk, so one test can walk the
    // same root twice and see different files.
    dirHolds: ({
      path,
      entries,
    }: {
      path: string;
      entries: readonly { name: string; kind: 'file' | 'directory' }[];
    }): void => {
      walkProxy.queueDir({ path, entries });
    },
    fileContent: ({ path, content }: { path: string; content: string }): void => {
      readFileGateway.returns({ path, contents: content });
    },
    readDenied: ({ path }: { path: string }): void => {
      readFileGateway.denied({ path });
    },
  };
};
