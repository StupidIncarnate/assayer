import { fsMkdirAdapterProxy } from '../../../adapters/fs/mkdir/fs-mkdir-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';

export const runConsoleSaveBrokerProxy = (): {
  succeeds: () => void;
  getWrittenPath: () => unknown;
  getWrittenContent: () => unknown;
  getMkdirArgs: () => readonly unknown[];
  wasWritten: () => boolean;
} => {
  const mkdirProxy = fsMkdirAdapterProxy();
  const writeFileProxy = fsWriteFileAdapterProxy();

  return {
    succeeds: (): void => {
      mkdirProxy.succeeds();
      writeFileProxy.succeeds();
    },
    getWrittenPath: (): unknown => writeFileProxy.getWrittenPath(),
    getWrittenContent: (): unknown => writeFileProxy.getWrittenContent(),
    getMkdirArgs: (): readonly unknown[] => mkdirProxy.getMkdirArgs(),
    wasWritten: (): boolean => writeFileProxy.wasCalled(),
  };
};
