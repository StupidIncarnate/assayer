import { analyzeFileBrokerProxy } from '../../analyze/file/analyze-file-broker.proxy';
import { fileCountContract } from '@assayer/shared/contracts';
import type { FileCount } from '@assayer/shared/contracts';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';
import { renameProxy } from '#gateway/node/fs__promises/rename/rename.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';

export const compileProcessFileBrokerProxy = (): {
  // Every address is the blob's exact path: `<blobsDir>/<contentHash>.json`. The broker writes the blob
  // atomically: the bytes go to `<blobsDir>/<contentHash>.json.tmp` first, and a rename moves them to
  // the final path. So a caller asks for the written bytes with that tmp path, and naming it in the
  // test is what proves the write went through the tmp file rather than straight to the final one.
  blobExists: ({ blobsDir, contentHash }: { blobsDir: string; contentHash: string }) => void;
  blobMissing: ({ blobsDir, contentHash }: { blobsDir: string; contentHash: string }) => void;
  getWrittenBlobFor: ({ path }: { path: string }) => unknown;
  wasWriteCalled: ({ path }: { path: string }) => boolean;
  processedCount: () => FileCount;
} => {
  const existsGateway = pathExistsProxy();
  const ensureDirGateway = ensureDirProxy();
  const writeFileGateway = writeFileProxy();
  const renameGateway = renameProxy();
  analyzeFileBrokerProxy();

  return {
    blobExists: ({ blobsDir, contentHash }: { blobsDir: string; contentHash: string }): void => {
      existsGateway.present({ path: `${blobsDir}/${contentHash}.json` });
    },
    blobMissing: ({ blobsDir, contentHash }: { blobsDir: string; contentHash: string }): void => {
      const blobPath = `${blobsDir}/${contentHash}.json`;
      existsGateway.missing({ path: blobPath });
      ensureDirGateway.succeeds({ path: blobsDir });
      writeFileGateway.succeeds({ path: `${blobPath}.tmp` });
      renameGateway.succeeds({ from: `${blobPath}.tmp`, to: blobPath });
    },
    getWrittenBlobFor: ({ path }: { path: string }): unknown =>
      writeFileGateway.writtenContentsFor({ path }),
    wasWriteCalled: ({ path }: { path: string }): boolean =>
      writeFileGateway.getCallsFor({ path }).length > 0,
    // Counts the existence checks made on blob files, which are the only paths this broker checks.
    processedCount: (): FileCount =>
      fileCountContract.parse(
        existsGateway.getCallsFor({
          path: (value: unknown): boolean => typeof value === 'string' && value.endsWith('.json'),
        }).length,
      ),
  };
};
