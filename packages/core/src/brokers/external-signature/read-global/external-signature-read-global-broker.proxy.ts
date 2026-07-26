import { registerMock } from '@dungeonmaster/testing/register-mock';

import { cryptoSha256AdapterProxy } from '../../../adapters/crypto/sha256/crypto-sha256-adapter.proxy';
import { fsExistsAdapterProxy } from '../../../adapters/fs/exists/fs-exists-adapter.proxy';
import { fsMkdirAdapterProxy } from '../../../adapters/fs/mkdir/fs-mkdir-adapter.proxy';
import { fsRenameAdapterProxy } from '../../../adapters/fs/rename/fs-rename-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { tsMorphReadGlobalSignatureAdapter } from '../../../adapters/ts-morph/read-global-signature/ts-morph-read-global-signature-adapter';
import { tsMorphReadGlobalSignatureAdapterProxy } from '../../../adapters/ts-morph/read-global-signature/ts-morph-read-global-signature-adapter.proxy';

export const externalSignatureReadGlobalBrokerProxy = (): {
  cacheMiss: () => void;
  cacheHit: () => void;
  readsSignature: ({ signature, declText }: { signature: unknown; declText: string }) => void;
  readsType: ({ type, declText }: { type: unknown; declText: string }) => void;
  readsNoUsableTypes: () => void;
  wasWritten: () => boolean;
  // The payload the broker cached. One call writes exactly one file, into
  // `<cacheDir>/global-signatures/`, so that directory is the address. The file's own NAME is a hash of
  // the declaration text the read returned, which is the very thing this broker derives, so a test
  // cannot name it up front without re-deriving it.
  getWrittenPayload: () => unknown;
} => {
  // The cache existence check and atomic write run through the REAL fs adapters with only their
  // underlying node calls mocked; the sha256 hasher runs REAL so the cache key is a true content hash;
  // the ts-morph global read is REPLACED wholesale so these tests cover caching only.
  const existsProxy = fsExistsAdapterProxy();
  const mkdirProxy = fsMkdirAdapterProxy();
  const writeFileProxy = fsWriteFileAdapterProxy();
  const renameProxy = fsRenameAdapterProxy();
  cryptoSha256AdapterProxy();
  tsMorphReadGlobalSignatureAdapterProxy();

  const readHandle = registerMock({ fn: tsMorphReadGlobalSignatureAdapter });
  readHandle.calledWith([]).returns({ usable: false });

  return {
    cacheMiss: (): void => {
      existsProxy.fails();
      mkdirProxy.succeeds();
      writeFileProxy.succeeds();
      renameProxy.succeeds();
    },
    cacheHit: (): void => {
      existsProxy.succeeds();
    },
    readsSignature: ({ signature, declText }: { signature: unknown; declText: string }): void => {
      readHandle.calledWith([]).returns({ usable: true, result: 'signature', signature, declText });
    },
    readsType: ({ type, declText }: { type: unknown; declText: string }): void => {
      readHandle.calledWith([]).returns({ usable: true, result: 'type', type, declText });
    },
    readsNoUsableTypes: (): void => {
      readHandle.calledWith([]).returns({ usable: false });
    },
    wasWritten: (): boolean => writeFileProxy.wasCalled(),
    getWrittenPayload: (): unknown =>
      JSON.parse(String(writeFileProxy.getWrittenContentMatching({ pathIncludes: '/global-signatures/' }))),
  };
};
