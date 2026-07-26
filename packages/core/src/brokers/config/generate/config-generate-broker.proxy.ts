import { fsMkdirAdapterProxy } from '../../../adapters/fs/mkdir/fs-mkdir-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';

export const configGenerateBrokerProxy = (): {
  succeeds: () => void;
  // Every path the broker wrote, in call order. A test asking WHICH path the config landed at asserts
  // this whole list, so a second write nobody expected fails it.
  getWrittenPaths: () => unknown[];
  getWrittenContentFor: ({ path }: { path: string }) => unknown;
} => {
  const mkdirProxy = fsMkdirAdapterProxy();
  const writeFileProxy = fsWriteFileAdapterProxy();

  return {
    succeeds: (): void => {
      mkdirProxy.succeeds();
      writeFileProxy.succeeds();
    },
    getWrittenPaths: (): unknown[] => writeFileProxy.getWrittenPaths(),
    getWrittenContentFor: ({ path }: { path: string }): unknown =>
      writeFileProxy.getWrittenContentFor({ path }),
  };
};
