import { fsMkdirAdapterProxy } from '../../../adapters/fs/mkdir/fs-mkdir-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { fsRenameAdapterProxy } from '../../../adapters/fs/rename/fs-rename-adapter.proxy';

export const resolvedIndexWriteBrokerProxy = (): {
  succeeds: () => void;
  // Every path written, in call order. Asking WHICH path the broker wrote to cannot be addressed by
  // that path without assuming the answer, so a caller reads the whole list and asserts it complete.
  getWrittenPaths: () => unknown[];
  // Addressed on the SOURCE path, so the destination it answers with is a real assertion rather than
  // an echo of what the caller asked for.
  getRenameArgs: ({ from }: { from: string }) => readonly unknown[];
  wasWritten: () => boolean;
  // Answers with the index written to the asked-for path, never with whichever write ran last.
  getWrittenIndex: ({ path }: { path: string }) => unknown;
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
    getWrittenPaths: (): unknown[] => writeFileProxy.getWrittenPaths(),
    getRenameArgs: ({ from }: { from: string }): readonly unknown[] =>
      renameProxy.getRenameArgs({ from }),
    wasWritten: (): boolean => writeFileProxy.wasCalled(),
    getWrittenIndex: ({ path }: { path: string }): unknown =>
      JSON.parse(String(writeFileProxy.getWrittenContentFor({ path }))),
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
