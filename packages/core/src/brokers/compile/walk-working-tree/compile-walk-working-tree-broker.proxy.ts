import { readdirEntriesProxy } from '#gateway/node/fs__promises/readdir-entries/readdir-entries.proxy';

export const compileWalkWorkingTreeBrokerProxy = (): {
  queueDir: ({
    path,
    entries,
  }: {
    path: string;
    entries: readonly { name: string; kind: 'file' | 'directory' }[];
  }) => void;
  // The read is deliberately unwrapped -- no try/catch -- so a filesystem rejection (EACCES and the
  // like) propagates to the caller unmodified. This stages that rejection for one directory.
  dirReadDenied: ({ path }: { path: string }) => void;
} => {
  const readdirProxy = readdirEntriesProxy();

  return {
    queueDir: ({
      path,
      entries,
    }: {
      path: string;
      entries: readonly { name: string; kind: 'file' | 'directory' }[];
    }): void => {
      readdirProxy.returns({ path, entries });
    },
    dirReadDenied: ({ path }: { path: string }): void => {
      readdirProxy.denied({ path });
    },
  };
};
