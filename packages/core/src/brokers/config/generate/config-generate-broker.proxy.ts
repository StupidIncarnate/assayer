import { writeFileCreatingParentProxy } from '#gateway/node/fs__promises/write-file-creating-parent/write-file-creating-parent.proxy';

export const configGenerateBrokerProxy = (): {
  succeeds: ({ path }: { path: string }) => void;
  getWrittenContentFor: ({ path }: { path: string }) => unknown;
  // The directories created before the config was written. A test asking WHERE the config landed
  // asserts this together with the written content.
  getCreatedDirsFor: ({ path }: { path: string }) => readonly unknown[][];
} => {
  const writeProxy = writeFileCreatingParentProxy();

  return {
    succeeds: ({ path }: { path: string }): void => {
      writeProxy.succeeds({ path });
    },
    getWrittenContentFor: ({ path }: { path: string }): unknown =>
      writeProxy.writtenContentsFor({ path }),
    getCreatedDirsFor: ({ path }: { path: string }): readonly unknown[][] =>
      writeProxy.mkdirCallsFor({ path }),
  };
};
