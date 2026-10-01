import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { renameProxy } from '#gateway/node/fs__promises/rename/rename.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';

export const harnessIndexWriteBrokerProxy = (): {
  // Stages the whole mkdir -> write -> rename sequence for one namespace's index.
  succeeds: ({ configDir, namespace }: { configDir: string; namespace: string }) => void;
  // Every path written under the harness cache directory, in call order. A write to any other path
  // is never staged, so it throws rather than landing silently.
  getWrittenPaths: ({ configDir }: { configDir: string }) => unknown[];
  // Addressed on the SOURCE path, so the destination it answers with is a real assertion rather than
  // an echo of what the caller asked for.
  getRenameArgs: ({ from }: { from: string }) => readonly unknown[];
  // Answers with the index written to the asked-for path.
  getWrittenIndex: ({ path }: { path: string }) => unknown;
  // None of the three writes below are wrapped in try/catch, so each stages a distinct failure
  // point along the mkdir -> write -> rename sequence.
  mkdirDenied: ({ configDir }: { configDir: string }) => void;
  writeFailsNoSpace: ({ configDir, namespace }: { configDir: string; namespace: string }) => void;
  renameFailsMissing: ({ configDir, namespace }: { configDir: string; namespace: string }) => void;
} => {
  const dirProxy = ensureDirProxy();
  const fileProxy = writeFileProxy();
  const moveProxy = renameProxy();

  return {
    succeeds: ({ configDir, namespace }: { configDir: string; namespace: string }): void => {
      const dir = `${configDir}/.assayer/cache/harness`;
      dirProxy.succeeds({ path: dir });
      fileProxy.succeeds({ path: `${dir}/${namespace}.json.tmp` });
      moveProxy.succeeds({
        from: `${dir}/${namespace}.json.tmp`,
        to: `${dir}/${namespace}.json`,
      });
    },
    getWrittenPaths: ({ configDir }: { configDir: string }): unknown[] =>
      fileProxy
        .getCallsFor({
          path: (value: unknown): boolean =>
            String(value).startsWith(`${configDir}/.assayer/cache/harness/`),
        })
        .map((call) => call[0]),
    getRenameArgs: ({ from }: { from: string }): readonly unknown[] =>
      moveProxy
        .getCallsFor({ from, to: (value: unknown): boolean => typeof value === 'string' })
        .at(-1) ?? [],
    getWrittenIndex: ({ path }: { path: string }): unknown =>
      JSON.parse(String(fileProxy.getCallsFor({ path }).at(-1)?.[1])),
    mkdirDenied: ({ configDir }: { configDir: string }): void => {
      const path = `${configDir}/.assayer/cache/harness`;
      dirProxy.rejects({ path, error: FsErrorStub({ code: 'EACCES', path, syscall: 'mkdir' }) });
    },
    writeFailsNoSpace: ({ configDir, namespace }: { configDir: string; namespace: string }): void => {
      const dir = `${configDir}/.assayer/cache/harness`;
      const path = `${dir}/${namespace}.json.tmp`;
      dirProxy.succeeds({ path: dir });
      fileProxy.rejects({ path, error: FsErrorStub({ code: 'ENOSPC', path, syscall: 'write' }) });
    },
    renameFailsMissing: ({ configDir, namespace }: { configDir: string; namespace: string }): void => {
      const dir = `${configDir}/.assayer/cache/harness`;
      const from = `${dir}/${namespace}.json.tmp`;
      dirProxy.succeeds({ path: dir });
      fileProxy.succeeds({ path: from });
      moveProxy.rejects({
        from,
        to: `${dir}/${namespace}.json`,
        error: FsErrorStub({ code: 'ENOENT', path: from, syscall: 'rename' }),
      });
    },
  };
};
