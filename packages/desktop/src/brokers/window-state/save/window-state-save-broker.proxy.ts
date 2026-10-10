import { join } from '#gateway/node/path';
import { writeFileCreatingParentProxy } from '#gateway/node/fs__promises/write-file-creating-parent/write-file-creating-parent.proxy';
import type { FsError } from '#gateway/node/fs';

export const windowStateSaveBrokerProxy = (): {
  setupSaveSucceeds: (params: { repoPath: string }) => void;
  setupWriteFails: (params: { repoPath: string; error: FsError }) => void;
  savedContents: (params: { repoPath: string }) => unknown;
} => {
  const writeFileProxy = writeFileCreatingParentProxy();

  return {
    setupSaveSucceeds: ({ repoPath }: { repoPath: string }): void => {
      writeFileProxy.succeeds({ path: join(repoPath, '.assayer', 'window-state.json') });
    },
    setupWriteFails: ({ repoPath, error }: { repoPath: string; error: FsError }): void => {
      writeFileProxy.writeRejects({ path: join(repoPath, '.assayer', 'window-state.json'), error });
    },
    savedContents: ({ repoPath }: { repoPath: string }): unknown =>
      writeFileProxy.writtenContentsFor({ path: join(repoPath, '.assayer', 'window-state.json') }),
  };
};
