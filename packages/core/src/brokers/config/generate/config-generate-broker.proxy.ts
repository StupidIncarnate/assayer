import { fsMkdirAdapterProxy } from '../../../adapters/fs/mkdir/fs-mkdir-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';

export const configGenerateBrokerProxy = (): {
  succeeds: () => void;
  getWrittenPath: () => unknown;
  getWrittenContent: () => unknown;
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
  };
};
