import { ensureDirSyncProxy } from '#gateway/node/fs/ensure-dir-sync/ensure-dir-sync.proxy';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { rmSyncProxy } from '#gateway/node/fs/rm-sync/rm-sync.proxy';
import { writeFileSyncProxy } from '#gateway/node/fs/write-file-sync/write-file-sync.proxy';
import { join } from '#gateway/node/path';

import { generatorLayoutStatics } from '../../../statics/generator-layout/generator-layout-statics';

export const specimensWriteBrokerProxy = (): {
  // Every folder and file under the root can be created, and the three generator-owned paths can be removed.
  setupWritableRoot: ({ outRoot }: { outRoot: string }) => void;
  // One path under the root cannot be written (EACCES).
  setupWriteDenied: ({ outRoot, relPath }: { outRoot: string; relPath: string }) => void;
  // What was removed under the root: the source folder, then the manifest, then the refusals file.
  removedPaths: ({ outRoot }: { outRoot: string }) => unknown[][];
  // The text written to one path under the root, or undefined when nothing was written there.
  writtenContent: ({ outRoot, relPath }: { outRoot: string; relPath: string }) => unknown;
  // Every call that wrote one path under the root, as the file system received it.
  writeCallsFor: ({ outRoot, relPath }: { outRoot: string; relPath: string }) => unknown[][];
} => {
  const removals = rmSyncProxy();
  const dirs = ensureDirSyncProxy();
  const writes = writeFileSyncProxy();
  const { sourceFolder, manifestFile, refusalsFile } = generatorLayoutStatics.output;

  return {
    setupWritableRoot: ({ outRoot }: { outRoot: string }): void => {
      removals.succeeds({ path: join(outRoot, sourceFolder) });
      removals.succeeds({ path: join(outRoot, manifestFile) });
      removals.succeeds({ path: join(outRoot, refusalsFile) });
      dirs.succeedsUnder({ root: outRoot });
      writes.succeedsUnder({ root: outRoot });
    },
    setupWriteDenied: ({ outRoot, relPath }: { outRoot: string; relPath: string }): void => {
      const path = join(outRoot, relPath);
      writes.throws({ path, error: FsErrorStub({ code: 'EACCES', path, syscall: 'open' }) });
    },
    removedPaths: ({ outRoot }: { outRoot: string }): unknown[][] => [
      ...removals.calls({ path: join(outRoot, sourceFolder) }),
      ...removals.calls({ path: join(outRoot, manifestFile) }),
      ...removals.calls({ path: join(outRoot, refusalsFile) }),
    ],
    writtenContent: ({ outRoot, relPath }: { outRoot: string; relPath: string }): unknown =>
      writes.writtenContents({ path: join(outRoot, relPath) }),
    writeCallsFor: ({ outRoot, relPath }: { outRoot: string; relPath: string }): unknown[][] =>
      writes.calls({ path: join(outRoot, relPath) }),
  };
};
