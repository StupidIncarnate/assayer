import { registerMock } from '@dungeonmaster/testing/register-mock';
import { fileCountContract } from '@assayer/shared/contracts';
import type { FileCount } from '@assayer/shared/contracts';

import { contentHashTransformerProxy } from '../../../transformers/content-hash/content-hash-transformer.proxy';
import { fsExistsAdapterProxy } from '../../../adapters/fs/exists/fs-exists-adapter.proxy';
import { fsMkdirAdapterProxy } from '../../../adapters/fs/mkdir/fs-mkdir-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsRenameAdapterProxy } from '../../../adapters/fs/rename/fs-rename-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { externalSignatureReadDeclarationBroker } from '../read-declaration/external-signature-read-declaration-broker';
import { externalSignatureReadDeclarationBrokerProxy } from '../read-declaration/external-signature-read-declaration-broker.proxy';

export const externalSignatureReadBrokerProxy = (): {
  cacheMiss: ({ dtsContent }: { dtsContent: string }) => void;
  cacheHit: ({ dtsContent, signatureJson }: { dtsContent: string; signatureJson: string }) => void;
  readsSignature: ({ signature }: { signature: unknown }) => void;
  readsNoUsableTypes: () => void;
  signatureReadCount: () => FileCount;
  wasWritten: () => boolean;
  // The signature the broker cached. One call writes exactly one file, into
  // `<cacheDir>/external-signatures/`, so that directory is the address. The file's own NAME is a hash
  // of the `.d.ts` bytes, which is the very thing this broker derives, so a test cannot name it up
  // front without re-deriving it.
  getWrittenSignature: () => unknown;
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
  contentHashTransformerProxy();
  externalSignatureReadDeclarationBrokerProxy();

  const readHandle = registerMock({ fn: externalSignatureReadDeclarationBroker });
  readHandle.calledWith([]).returns({ usable: false });

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
      readHandle.calledWith([]).returns({ usable: true, signature });
    },
    readsNoUsableTypes: (): void => {
      readHandle.calledWith([]).returns({ usable: false });
    },
    signatureReadCount: (): FileCount => fileCountContract.parse(readHandle.callsMatching([]).length),
    wasWritten: (): boolean => writeFileProxy.wasCalled(),
    getWrittenSignature: (): unknown =>
      JSON.parse(String(writeFileProxy.getWrittenContentMatching({ pathIncludes: '/external-signatures/' }))),
  };
};
