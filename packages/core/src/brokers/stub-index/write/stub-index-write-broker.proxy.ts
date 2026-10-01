import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { renameProxy } from '#gateway/node/fs__promises/rename/rename.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';

export const stubIndexWriteBrokerProxy = (): {
  succeeds: ({ configDir, namespace }: { configDir: string; namespace: string }) => void;
  // Every rename of the tmp path onto the final path, as full argument tuples. A rename from
  // anywhere else is not in the answer.
  getRenameArgs: ({
    configDir,
    namespace,
  }: {
    configDir: string;
    namespace: string;
  }) => readonly unknown[][];
  // Answers with the index written to the asked-for path, never with whichever write ran last.
  getWrittenIndex: ({ path }: { path: string }) => unknown;
  // None of the three writes are wrapped in try/catch, so each stages a distinct rejection point
  // along the mkdir -> write -> rename sequence.
  mkdirDenied: ({ configDir }: { configDir: string }) => void;
  writeDiskFull: ({ configDir, namespace }: { configDir: string; namespace: string }) => void;
  renameMissing: ({ configDir, namespace }: { configDir: string; namespace: string }) => void;
} => {
  const dirProxy = ensureDirProxy();
  const fileProxy = writeFileProxy();
  const moveProxy = renameProxy();

  return {
    succeeds: ({ configDir, namespace }: { configDir: string; namespace: string }): void => {
      const dir = `${configDir}/.assayer/cache/stubs`;
      dirProxy.succeeds({ path: dir });
      fileProxy.succeeds({ path: `${dir}/${namespace}.json.tmp` });
      moveProxy.succeeds({ from: `${dir}/${namespace}.json.tmp`, to: `${dir}/${namespace}.json` });
    },
    getRenameArgs: ({
      configDir,
      namespace,
    }: {
      configDir: string;
      namespace: string;
    }): readonly unknown[][] => {
      const dir = `${configDir}/.assayer/cache/stubs`;
      return moveProxy.getCallsFor({
        from: `${dir}/${namespace}.json.tmp`,
        to: `${dir}/${namespace}.json`,
      });
    },
    getWrittenIndex: ({ path }: { path: string }): unknown =>
      JSON.parse(String(fileProxy.writtenContentsFor({ path }))),
    mkdirDenied: ({ configDir }: { configDir: string }): void => {
      const path = `${configDir}/.assayer/cache/stubs`;
      dirProxy.rejects({ path, error: FsErrorStub({ code: 'EACCES', path, syscall: 'mkdir' }) });
    },
    writeDiskFull: ({ configDir, namespace }: { configDir: string; namespace: string }): void => {
      const dir = `${configDir}/.assayer/cache/stubs`;
      const path = `${dir}/${namespace}.json.tmp`;
      dirProxy.succeeds({ path: dir });
      fileProxy.rejects({ path, error: FsErrorStub({ code: 'ENOSPC', path, syscall: 'write' }) });
    },
    renameMissing: ({ configDir, namespace }: { configDir: string; namespace: string }): void => {
      const dir = `${configDir}/.assayer/cache/stubs`;
      const from = `${dir}/${namespace}.json.tmp`;
      const to = `${dir}/${namespace}.json`;
      dirProxy.succeeds({ path: dir });
      fileProxy.succeeds({ path: from });
      moveProxy.rejects({
        from,
        to,
        error: FsErrorStub({ code: 'ENOENT', path: from, syscall: 'rename' }),
      });
    },
  };
};
