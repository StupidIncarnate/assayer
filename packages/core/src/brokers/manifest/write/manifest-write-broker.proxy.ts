import { fsMkdirAdapterProxy } from '../../../adapters/fs/mkdir/fs-mkdir-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { fsRenameAdapterProxy } from '../../../adapters/fs/rename/fs-rename-adapter.proxy';

export const manifestWriteBrokerProxy = (): {
  succeeds: () => void;
  getMkdirArgs: () => readonly unknown[];
  getWrittenPath: () => unknown;
  getWrittenContent: () => unknown;
  getRenameArgs: () => readonly unknown[];
  wasWritten: () => boolean;
  getWrittenManifest: () => unknown;
} => {
  const mkdirProxy = fsMkdirAdapterProxy();
  const writeFileProxy = fsWriteFileAdapterProxy();
  const renameProxy = fsRenameAdapterProxy();

  return {
    succeeds: (): void => {
      mkdirProxy.succeeds();
      writeFileProxy.succeeds();
      renameProxy.succeeds();
    },
    getMkdirArgs: (): readonly unknown[] => mkdirProxy.getMkdirArgs(),
    getWrittenPath: (): unknown => writeFileProxy.getWrittenPath(),
    getWrittenContent: (): unknown => writeFileProxy.getWrittenContent(),
    getRenameArgs: (): readonly unknown[] => renameProxy.getRenameArgs(),
    wasWritten: (): boolean => writeFileProxy.wasCalled(),
    getWrittenManifest: (): unknown => JSON.parse(String(writeFileProxy.getWrittenContent())),
  };
};
