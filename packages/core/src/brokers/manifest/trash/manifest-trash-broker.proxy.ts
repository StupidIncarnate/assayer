import { fsRmAdapterProxy } from '../../../adapters/fs/rm/fs-rm-adapter.proxy';

export const manifestTrashBrokerProxy = (): {
  succeeds: () => void;
  getRmArgs: () => readonly unknown[];
} => {
  const rmProxy = fsRmAdapterProxy();

  return {
    succeeds: (): void => {
      rmProxy.succeeds();
    },
    getRmArgs: (): readonly unknown[] => rmProxy.getRmArgs(),
  };
};
