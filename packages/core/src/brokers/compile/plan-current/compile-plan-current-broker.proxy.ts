import { compileWalkWorkingTreeBrokerProxy } from '../../compile/walk-working-tree/compile-walk-working-tree-broker.proxy';
import { harnessClassifyBrokerProxy } from '../../harness/classify/harness-classify-broker.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

export const compilePlanCurrentBrokerProxy = (): {
  queueDir: ({
    path,
    entries,
  }: {
    path: string;
    entries: readonly { name: string; kind: 'file' | 'directory' }[];
  }) => void;
  queueFileContent: ({ path, content }: { path: string; content: string }) => void;
  // The read is deliberately unwrapped -- no try/catch -- so a filesystem rejection (EACCES and
  // the like) propagates to the caller unmodified. This stages that rejection for one file.
  readDenied: ({ path }: { path: string }) => void;
} => {
  const walkProxy = compileWalkWorkingTreeBrokerProxy();
  const readFileGateway = readFileProxy();
  harnessClassifyBrokerProxy();

  return {
    queueDir: ({
      path,
      entries,
    }: {
      path: string;
      entries: readonly { name: string; kind: 'file' | 'directory' }[];
    }): void => {
      walkProxy.queueDir({ path, entries });
    },
    queueFileContent: ({ path, content }: { path: string; content: string }): void => {
      readFileGateway.returns({ path, contents: content });
    },
    readDenied: ({ path }: { path: string }): void => {
      readFileGateway.denied({ path });
    },
  };
};
