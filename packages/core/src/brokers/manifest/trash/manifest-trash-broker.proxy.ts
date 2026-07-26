import { fsRmAdapterProxy } from '../../../adapters/fs/rm/fs-rm-adapter.proxy';

export const manifestTrashBrokerProxy = (): {
  succeeds: () => void;
  // Addressed on the directory the broker removes. The options this answers with belong to that one
  // removal, never to whichever rm happened to run last.
  getRmArgs: ({ path }: { path: string }) => readonly unknown[];
} => {
  const rmProxy = fsRmAdapterProxy();

  return {
    succeeds: (): void => {
      rmProxy.succeeds();
    },
    getRmArgs: ({ path }: { path: string }): readonly unknown[] => rmProxy.getRmArgs({ path }),
  };
};
