import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';
import { readdirSyncProxy } from '#gateway/node/fs/readdir-sync/readdir-sync.proxy';
import { join } from '#gateway/node/path';
import { readTsconfigProxy } from '#gateway/npm/typescript/read-tsconfig/read-tsconfig.proxy';

import { requireActual } from '@dungeonmaster/testing/register-mock';

import { generatorLayoutStatics } from '../../../statics/generator-layout/generator-layout-statics';
import { typescriptLibLocateBrokerProxy } from '../../typescript-lib/locate/typescript-lib-locate-broker.proxy';

export const declarationsLoadBrokerProxy = (): {
  // A declarations folder holding exactly these files, each given by its path under the root (`kit.ts`,
  // `syntax/gt.syntax.ts`). Its tsconfig lists every file and checks them under strict mode with no `@types`.
  setupTree: ({
    declarationsRoot,
    files,
  }: {
    declarationsRoot: string;
    files: readonly { relPath: string; content: string }[];
  }) => void;
  // A declarations folder whose tsconfig TypeScript cannot read.
  setupUnreadableConfig: ({ declarationsRoot }: { declarationsRoot: string }) => void;
} => {
  typescriptLibLocateBrokerProxy();
  const tsconfigs = readTsconfigProxy();
  const reads = readFileSyncProxy();
  const realFs = requireActual<{ readFileSync: (path: string, encoding: 'utf8') => string }>({ module: 'fs' });
  const listings = readdirSyncProxy();
  const { containers, syntax, shims, tsconfigFile } = generatorLayoutStatics.declarations;

  return {
    setupTree: ({ declarationsRoot, files }): void => {
      // Installed type files are not the code under test: TypeScript's lib, `@types/node` and what it
      // references. The compiler reads them through the same file system call, so anything under
      // `node_modules` is answered from the real disk, and every declaration is still staged by its path.
      reads.implementsMatchingPath({
        path: (value) => typeof value === 'string' && value.includes('/node_modules/'),
        fn: (path) => realFs.readFileSync(path, 'utf8'),
      });
      for (const { folder } of [containers, syntax, shims]) {
        listings.returns({
          path: join(declarationsRoot, folder),
          names: files
            .filter(({ relPath }) => relPath.startsWith(`${folder}/`))
            .map(({ relPath }) => relPath.slice(folder.length + 1)),
        });
      }
      tsconfigs.tsconfigAt({
        configFilePath: join(declarationsRoot, tsconfigFile),
        fileNames: files.map(({ relPath }) => join(declarationsRoot, relPath)),
        options: { strict: true, noEmit: true, lib: ['lib.es2022.d.ts'], types: [] },
      });
      for (const { relPath, content } of files) {
        reads.returns({ path: join(declarationsRoot, relPath), contents: content });
      }
    },
    setupUnreadableConfig: ({ declarationsRoot }): void => {
      for (const { folder } of [containers, syntax, shims]) {
        listings.returns({ path: join(declarationsRoot, folder), names: [] });
      }
      tsconfigs.unreadable({ configFilePath: join(declarationsRoot, tsconfigFile) });
    },
  };
};
