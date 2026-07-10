import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';

export const compileWalkWorkingTreeBrokerProxy = (): {
  queueDir: ({ entries }: { entries: readonly { name: string; isDirectory: boolean }[] }) => void;
} => {
  const fsReaddirProxy = fsReaddirAdapterProxy();

  return {
    queueDir: ({ entries }: { entries: readonly { name: string; isDirectory: boolean }[] }): void => {
      fsReaddirProxy.returns({ entries });
    },
  };
};
