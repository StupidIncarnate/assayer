import { fsExistsAdapterProxy } from '../../../adapters/fs/exists/fs-exists-adapter.proxy';
import { fsMkdirAdapterProxy } from '../../../adapters/fs/mkdir/fs-mkdir-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { fsRenameAdapterProxy } from '../../../adapters/fs/rename/fs-rename-adapter.proxy';
import { tsMorphWalkFileAdapterProxy } from '../../../adapters/ts-morph/walk-file/ts-morph-walk-file-adapter.proxy';
import { cryptoSha256AdapterProxy } from '../../../adapters/crypto/sha256/crypto-sha256-adapter.proxy';
import { analyzeFileBrokerProxy } from '../../analyze/file/analyze-file-broker.proxy';
import type { FileCount } from '@assayer/shared/contracts';

export const compileProcessFileBrokerProxy = (): {
  blobExists: () => void;
  blobMissing: () => void;
  // The broker writes the blob atomically: the bytes go to `<blobsDir>/<contentHash>.json.tmp` first,
  // and a rename moves them to the final path. So the address a caller asks with is that tmp path, and
  // naming it in the test is what proves the write went through the tmp file rather than straight to
  // the final one.
  getWrittenBlobFor: ({ path }: { path: string }) => unknown;
  wasWriteCalled: () => boolean;
  processedCount: () => FileCount;
} => {
  const existsProxy = fsExistsAdapterProxy();
  const mkdirProxy = fsMkdirAdapterProxy();
  const writeFileProxy = fsWriteFileAdapterProxy();
  const renameProxy = fsRenameAdapterProxy();
  tsMorphWalkFileAdapterProxy();
  cryptoSha256AdapterProxy();
  analyzeFileBrokerProxy();

  return {
    blobExists: (): void => {
      existsProxy.succeeds();
    },
    blobMissing: (): void => {
      existsProxy.fails();
      mkdirProxy.succeeds();
      writeFileProxy.succeeds();
      renameProxy.succeeds();
    },
    getWrittenBlobFor: ({ path }: { path: string }): unknown =>
      writeFileProxy.getWrittenContentFor({ path }),
    wasWriteCalled: (): boolean => writeFileProxy.wasCalled(),
    processedCount: (): FileCount => existsProxy.callCount(),
  };
};
