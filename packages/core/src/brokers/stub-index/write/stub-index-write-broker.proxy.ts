import { fsMkdirAdapterProxy } from '../../../adapters/fs/mkdir/fs-mkdir-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { fsRenameAdapterProxy } from '../../../adapters/fs/rename/fs-rename-adapter.proxy';

export const stubIndexWriteBrokerProxy = (): {
  succeeds: () => void;
  getWrittenPath: () => unknown;
  getRenameArgs: () => readonly unknown[];
  wasWritten: () => boolean;
  getWrittenIndex: () => unknown;
  // None of the three writes below are wrapped in try/catch, so each stages a distinct rejection
  // point along the mkdir -> write -> rename sequence.
  mkdirThrows: ({ error }: { error: Error }) => void;
  writeThrows: ({ error }: { error: Error }) => void;
  renameThrows: ({ error }: { error: Error }) => void;
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
    getWrittenPath: (): unknown => writeFileProxy.getWrittenPath(),
    getRenameArgs: (): readonly unknown[] => renameProxy.getRenameArgs(),
    wasWritten: (): boolean => writeFileProxy.wasCalled(),
    getWrittenIndex: (): unknown => JSON.parse(String(writeFileProxy.getWrittenContent())),
    mkdirThrows: ({ error }: { error: Error }): void => {
      mkdirProxy.throws({ error });
    },
    writeThrows: ({ error }: { error: Error }): void => {
      mkdirProxy.succeeds();
      writeFileProxy.throws({ error });
    },
    renameThrows: ({ error }: { error: Error }): void => {
      mkdirProxy.succeeds();
      writeFileProxy.succeeds();
      renameProxy.throws({ error });
    },
  };
};
