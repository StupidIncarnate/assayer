import { readFileSyncIfExistsProxy } from '#gateway/node/fs/read-file-sync-if-exists/read-file-sync-if-exists.proxy';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';
import { walkFilesSyncProxy } from '#gateway/node/fs/walk-files-sync/walk-files-sync.proxy';
import { join } from '#gateway/node/path';

import { generatorLayoutStatics } from '../../../statics/generator-layout/generator-layout-statics';

export const specimensCheckBrokerProxy = (): {
  // The output root holds exactly these files. Files under `src` are listed by folder and read by
  // path. The manifest and the refusals file are read when listed here and are missing otherwise.
  setupExistingTree: ({
    outRoot,
    files,
  }: {
    outRoot: string;
    files: readonly { relPath: string; content: string }[];
  }) => void;
} => {
  const walk = walkFilesSyncProxy();
  const reads = readFileSyncProxy();
  const topReads = readFileSyncIfExistsProxy();
  const { sourceFolder, manifestFile, refusalsFile } = generatorLayoutStatics.output;

  return {
    setupExistingTree: ({
      outRoot,
      files,
    }: {
      outRoot: string;
      files: readonly { relPath: string; content: string }[];
    }): void => {
      const srcRoot = join(outRoot, sourceFolder);
      const listings = new Map<string, { files: Set<string>; dirs: Set<string> }>();
      listings.set(srcRoot, { files: new Set<string>(), dirs: new Set<string>() });

      for (const file of files) {
        const absPath = join(outRoot, file.relPath);
        if (file.relPath.startsWith(`${sourceFolder}/`)) {
          const segments = file.relPath.split('/');
          for (const [index, segment] of segments.entries()) {
            if (index > 0) {
              const dirPath = join(outRoot, ...segments.slice(0, index));
              const listing = listings.get(dirPath) ?? { files: new Set<string>(), dirs: new Set<string>() };
              if (index === segments.length - 1) {
                listing.files.add(segment);
              } else {
                listing.dirs.add(segment);
              }
              listings.set(dirPath, listing);
            }
          }
          walk.setupFileStat({ filePath: absPath, sizeBytes: file.content.length, modifiedAtMs: 0 });
          reads.returns({ path: absPath, contents: file.content });
        } else {
          topReads.returns({ path: absPath, contents: file.content });
        }
      }

      for (const [dirPath, listing] of listings) {
        walk.setupDirectory({ dirPath, files: [...listing.files], dirs: [...listing.dirs] });
      }
      for (const topFile of [manifestFile, refusalsFile]) {
        if (!files.some((file) => file.relPath === topFile)) {
          topReads.missing({ path: join(outRoot, topFile) });
        }
      }
    },
  };
};
