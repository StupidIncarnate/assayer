import { registerMock } from '@dungeonmaster/testing/register-mock';
import { fileCountContract } from '@assayer/shared/contracts';
import type { FileCount } from '@assayer/shared/contracts';

import { cryptoSha256AdapterProxy } from '../../../adapters/crypto/sha256/crypto-sha256-adapter.proxy';
import { fsExistsAdapterProxy } from '../../../adapters/fs/exists/fs-exists-adapter.proxy';
import { fsMkdirAdapterProxy } from '../../../adapters/fs/mkdir/fs-mkdir-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsRenameAdapterProxy } from '../../../adapters/fs/rename/fs-rename-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { tsMorphReadExternalSignatureAdapter } from '../../../adapters/ts-morph/read-external-signature/ts-morph-read-external-signature-adapter';
import { tsMorphReadExternalSignatureAdapterProxy } from '../../../adapters/ts-morph/read-external-signature/ts-morph-read-external-signature-adapter.proxy';

export const externalSignatureReadBrokerProxy = (): {
  cacheMiss: ({ dtsContent }: { dtsContent: string }) => void;
  cacheHit: ({ dtsContent, signatureJson }: { dtsContent: string; signatureJson: string }) => void;
  readsSignature: ({ signature }: { signature: unknown }) => void;
  readsNoUsableTypes: () => void;
  signatureReadCount: () => FileCount;
  wasWritten: () => boolean;
  getWrittenContent: () => unknown;
} => {
  // The `.d.ts` byte read, existence check, and atomic write run through the REAL fs adapters with
  // only their underlying node calls mocked; the sha256 hasher runs REAL so the cache key is a true
  // content hash; the ts-morph read is REPLACED wholesale so the broker's own tests cover caching,
  // not type reading (the adapter's tests cover that).
  const readFileProxy = fsReadFileAdapterProxy();
  const existsProxy = fsExistsAdapterProxy();
  const mkdirProxy = fsMkdirAdapterProxy();
  const writeFileProxy = fsWriteFileAdapterProxy();
  const renameProxy = fsRenameAdapterProxy();
  cryptoSha256AdapterProxy();
  tsMorphReadExternalSignatureAdapterProxy();

  const readHandle = registerMock({ fn: tsMorphReadExternalSignatureAdapter });
  readHandle.mockReturnValue({ usable: false });

  return {
    cacheMiss: ({ dtsContent }: { dtsContent: string }): void => {
      readFileProxy.returns({ content: dtsContent });
      existsProxy.fails();
      mkdirProxy.succeeds();
      writeFileProxy.succeeds();
      renameProxy.succeeds();
    },
    cacheHit: ({ dtsContent, signatureJson }: { dtsContent: string; signatureJson: string }): void => {
      readFileProxy.returns({ content: dtsContent });
      existsProxy.succeeds();
      readFileProxy.returns({ content: signatureJson });
    },
    readsSignature: ({ signature }: { signature: unknown }): void => {
      readHandle.mockReturnValue({ usable: true, signature });
    },
    readsNoUsableTypes: (): void => {
      readHandle.mockReturnValue({ usable: false });
    },
    signatureReadCount: (): FileCount => fileCountContract.parse(readHandle.mock.calls.length),
    wasWritten: (): boolean => writeFileProxy.wasCalled(),
    getWrittenContent: (): unknown => JSON.parse(String(writeFileProxy.getWrittenContent())),
  };
};
