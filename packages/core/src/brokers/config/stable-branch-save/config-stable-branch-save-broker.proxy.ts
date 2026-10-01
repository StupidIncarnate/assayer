import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';

export const configStableBranchSaveBrokerProxy = (): {
  succeeds: ({ path }: { path: string }) => void;
  // Every write to the path, in call order. A test asking WHAT landed at a path asserts this whole
  // list, so a second write nobody expected fails it.
  getWrittenContentsFor: ({ path }: { path: string }) => unknown[];
} => {
  const fileProxy = writeFileProxy();

  return {
    succeeds: ({ path }: { path: string }): void => {
      fileProxy.succeeds({ path });
    },
    getWrittenContentsFor: ({ path }: { path: string }): unknown[] =>
      fileProxy.getCallsFor({ path }).map((call) => call[1]),
  };
};
