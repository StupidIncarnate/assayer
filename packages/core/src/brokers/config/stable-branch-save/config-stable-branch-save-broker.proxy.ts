import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';

export const configStableBranchSaveBrokerProxy = (): {
  succeeds: () => void;
  getWrittenPath: () => unknown;
  getWrittenContent: () => unknown;
} => {
  const writeFileProxy = fsWriteFileAdapterProxy();

  return {
    succeeds: (): void => {
      writeFileProxy.succeeds();
    },
    getWrittenPath: (): unknown => writeFileProxy.getWrittenPath(),
    getWrittenContent: (): unknown => writeFileProxy.getWrittenContent(),
  };
};
