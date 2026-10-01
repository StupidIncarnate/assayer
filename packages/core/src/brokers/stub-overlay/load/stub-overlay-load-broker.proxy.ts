import { compileWalkWorkingTreeBrokerProxy } from '../../compile/walk-working-tree/compile-walk-working-tree-broker.proxy';
import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

export const stubOverlayLoadBrokerProxy = (): {
  dirExists: (params: { path: string }) => void;
  dirMissing: (params: { path: string }) => void;
  queueDir: (params: {
    path: string;
    entries: readonly { name: string; kind: 'file' | 'directory' }[];
  }) => void;
  queueFileContent: (params: { path: string; content: string }) => void;
  // The read is deliberately unwrapped -- no try/catch -- so a filesystem rejection (EACCES and the
  // like) propagates to the caller unmodified. This stages that rejection for one file.
  readDenied: (params: { path: string }) => void;
} => {
  const walkProxy = compileWalkWorkingTreeBrokerProxy();
  const existsProxy = pathExistsProxy();
  const readFileGateway = readFileProxy();

  return {
    dirExists: ({ path }: { path: string }): void => {
      existsProxy.present({ path });
    },
    dirMissing: ({ path }: { path: string }): void => {
      existsProxy.missing({ path });
    },
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
