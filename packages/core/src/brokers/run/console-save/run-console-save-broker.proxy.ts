import { fsMkdirAdapterProxy } from '../../../adapters/fs/mkdir/fs-mkdir-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';

export const runConsoleSaveBrokerProxy = (): {
  succeeds: () => void;
  // Every path this save wrote, in call order. A test asking WHICH path the report landed on cannot
  // address that read by the path without assuming its own answer, so it reads the whole list and
  // asserts it complete — an extra write nobody expected fails it.
  getWrittenPaths: () => unknown[];
  // Answers for the asked-for path only.
  getWrittenContentFor: ({ path }: { path: string }) => unknown;
  // Answers for the asked-for directory only, as that mkdir call's full argument tuple.
  getMkdirArgs: ({ path }: { path: string }) => readonly unknown[];
  wasWritten: () => boolean;
} => {
  const mkdirProxy = fsMkdirAdapterProxy();
  const writeFileProxy = fsWriteFileAdapterProxy();

  return {
    succeeds: (): void => {
      mkdirProxy.succeeds();
      writeFileProxy.succeeds();
    },
    getWrittenPaths: (): unknown[] => writeFileProxy.getWrittenPaths(),
    getWrittenContentFor: ({ path }: { path: string }): unknown => writeFileProxy.getWrittenContentFor({ path }),
    getMkdirArgs: ({ path }: { path: string }): readonly unknown[] => mkdirProxy.getMkdirArgs({ path }),
    wasWritten: (): boolean => writeFileProxy.wasCalled(),
  };
};
