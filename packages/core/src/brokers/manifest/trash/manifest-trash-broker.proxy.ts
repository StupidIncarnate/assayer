import { rmProxy } from '#gateway/node/fs__promises/rm/rm.proxy';

export const manifestTrashBrokerProxy = (): {
  succeeds: ({ path }: { path: string }) => void;
  // Every rm call made on the path, as its full argument tuple, in call order.
  getRmCalls: ({ path }: { path: string }) => readonly unknown[][];
} => {
  const removeProxy = rmProxy();

  return {
    succeeds: ({ path }: { path: string }): void => {
      removeProxy.succeeds({ path });
    },
    getRmCalls: ({ path }: { path: string }): readonly unknown[][] =>
      removeProxy.getCallsFor({ path }),
  };
};
