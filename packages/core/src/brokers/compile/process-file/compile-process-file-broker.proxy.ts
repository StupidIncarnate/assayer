import type { CompilerOptions } from '#gateway/npm/typescript';

import { analyzeFileBrokerProxy } from '../../analyze/file/analyze-file-broker.proxy';
import { tsconfigOwnerBrokerProxy } from '../../tsconfig/owner/tsconfig-owner-broker.proxy';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';
import { renameProxy } from '#gateway/node/fs__promises/rename/rename.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';

export const compileProcessFileBrokerProxy = (): {
  // Every address is the blob's exact path: `<blobsDir>/<analysisHash>.json`. The broker writes the blob
  // atomically: the bytes go to `<blobsDir>/<analysisHash>.json.tmp` first, and a rename moves them to
  // the final path. So a caller asks for the written bytes with that tmp path, and naming it in the
  // test is what proves the write went through the tmp file rather than straight to the final one.
  blobExists: ({ blobsDir, analysisHash }: { blobsDir: string; analysisHash: string }) => void;
  blobMissing: ({ blobsDir, analysisHash }: { blobsDir: string; analysisHash: string }) => void;
  // The compiled files, under no tsconfig, or owned by one with these options.
  filesWithoutOwner: ({ absPaths }: { absPaths: readonly string[] }) => void;
  filesOwnedBy: ({
    absPaths,
    configFilePath,
    options,
  }: {
    absPaths: readonly string[];
    configFilePath: string;
    options: CompilerOptions;
  }) => void;
  getWrittenBlobFor: ({ path }: { path: string }) => unknown;
  wasWriteCalled: ({ path }: { path: string }) => boolean;
  processedCount: () => number;
} => {
  const existsGateway = pathExistsProxy();
  const ensureDirGateway = ensureDirProxy();
  const writeFileGateway = writeFileProxy();
  const renameGateway = renameProxy();
  const owner = tsconfigOwnerBrokerProxy();
  analyzeFileBrokerProxy();

  return {
    blobExists: ({ blobsDir, analysisHash }: { blobsDir: string; analysisHash: string }): void => {
      existsGateway.present({ path: `${blobsDir}/${analysisHash}.json` });
    },
    blobMissing: ({ blobsDir, analysisHash }: { blobsDir: string; analysisHash: string }): void => {
      const blobPath = `${blobsDir}/${analysisHash}.json`;
      existsGateway.missing({ path: blobPath });
      ensureDirGateway.succeeds({ path: blobsDir });
      writeFileGateway.succeeds({ path: `${blobPath}.tmp` });
      renameGateway.succeeds({ from: `${blobPath}.tmp`, to: blobPath });
    },
    filesWithoutOwner: ({ absPaths }: { absPaths: readonly string[] }): void => {
      owner.filesWithoutOwner({ absPaths });
    },
    filesOwnedBy: ({
      absPaths,
      configFilePath,
      options,
    }: {
      absPaths: readonly string[];
      configFilePath: string;
      options: CompilerOptions;
    }): void => {
      owner.filesOwnedBy({ absPaths, configFilePath, options });
    },
    getWrittenBlobFor: ({ path }: { path: string }): unknown =>
      writeFileGateway.writtenContentsFor({ path }),
    wasWriteCalled: ({ path }: { path: string }): boolean =>
      writeFileGateway.getCallsFor({ path }).length > 0,
    // Counts the existence checks made on blob files, which are the only paths this broker checks.
    processedCount: (): number =>
      existsGateway.getCallsFor({
          path: (value: unknown): boolean => typeof value === 'string' && value.endsWith('.json'),
        }).length,
  };
};
