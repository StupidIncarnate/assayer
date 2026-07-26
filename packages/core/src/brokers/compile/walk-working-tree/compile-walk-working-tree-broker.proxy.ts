import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';

export const compileWalkWorkingTreeBrokerProxy = (): {
  queueDir: ({ entries }: { entries: readonly { name: string; isDirectory: boolean }[] }) => void;
  // The read is deliberately unwrapped -- no try/catch -- so a filesystem rejection (ENOENT and the
  // like) propagates to the caller unmodified. This stages that rejection.
  dirReadThrows: ({ error }: { error: Error }) => void;
} => {
  const fsReaddirProxy = fsReaddirAdapterProxy();

  return {
    queueDir: ({ entries }: { entries: readonly { name: string; isDirectory: boolean }[] }): void => {
      fsReaddirProxy.returns({ entries });
    },
    dirReadThrows: ({ error }: { error: Error }): void => {
      fsReaddirProxy.throws({ error });
    },
  };
};
