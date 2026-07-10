import { fsExistsAdapterProxy } from '../../../adapters/fs/exists/fs-exists-adapter.proxy';
import { fsMkdirAdapterProxy } from '../../../adapters/fs/mkdir/fs-mkdir-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { fsRenameAdapterProxy } from '../../../adapters/fs/rename/fs-rename-adapter.proxy';
import { tsMorphExtractMapAdapterProxy } from '../../../adapters/ts-morph/extract-map/ts-morph-extract-map-adapter.proxy';
import { cryptoSha256AdapterProxy } from '../../../adapters/crypto/sha256/crypto-sha256-adapter.proxy';
import type { FileCount } from '@assayer/shared/contracts';

export const compileProcessFileBrokerProxy = (): {
  blobExists: () => void;
  blobMissing: () => void;
  getWrittenBlob: () => unknown;
  wasWriteCalled: () => boolean;
  processedCount: () => FileCount;
} => {
  const existsProxy = fsExistsAdapterProxy();
  const mkdirProxy = fsMkdirAdapterProxy();
  const writeFileProxy = fsWriteFileAdapterProxy();
  const renameProxy = fsRenameAdapterProxy();
  tsMorphExtractMapAdapterProxy();
  cryptoSha256AdapterProxy();

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
    getWrittenBlob: (): unknown => writeFileProxy.getWrittenContent(),
    wasWriteCalled: (): boolean => writeFileProxy.wasCalled(),
    processedCount: (): FileCount => existsProxy.callCount(),
  };
};
