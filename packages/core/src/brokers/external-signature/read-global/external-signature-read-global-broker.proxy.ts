import { registerMock } from '@dungeonmaster/testing/register-mock';

import { contentHashTransformer } from '../../../transformers/content-hash/content-hash-transformer';
import { externalSignatureReadGlobalDeclarationBroker } from '../read-global-declaration/external-signature-read-global-declaration-broker';
import { externalSignatureReadGlobalDeclarationBrokerProxy } from '../read-global-declaration/external-signature-read-global-declaration-broker.proxy';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';
import { renameProxy } from '#gateway/node/fs__promises/rename/rename.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';

const isGlobalSignatureCachePath = (value: unknown): boolean =>
  String(value).includes('/global-signatures/');

const cachePathFor = ({
  reference,
  declText,
  cacheDir,
}: {
  reference: Parameters<typeof externalSignatureReadGlobalDeclarationBroker>[0]['reference'];
  declText: string;
  cacheDir: string;
}): string => {
  const referenceKey =
    reference.kind === 'builtin'
      ? `b:${String(reference.specifier)} ${String(reference.importedName)} ${String(reference.called)}`
      : `g:${String(reference.name)}.${reference.member === undefined ? '' : String(reference.member)}.${String(reference.called)}`;
  const cacheKey = contentHashTransformer({ content: `${referenceKey}\n${declText}` });

  return `${cacheDir}/global-signatures/${String(cacheKey)}.json`;
};

export const externalSignatureReadGlobalBrokerProxy = (): {
  cacheMiss: (params: {
    reference: Parameters<typeof externalSignatureReadGlobalDeclarationBroker>[0]['reference'];
    declText: string;
    cacheDir: string;
  }) => void;
  cacheHit: (params: {
    reference: Parameters<typeof externalSignatureReadGlobalDeclarationBroker>[0]['reference'];
    declText: string;
    cacheDir: string;
  }) => void;
  readsSignature: (
    params: Parameters<typeof externalSignatureReadGlobalDeclarationBroker>[0] & {
      signature: unknown;
      declText: string;
    },
  ) => void;
  readsType: (
    params: Parameters<typeof externalSignatureReadGlobalDeclarationBroker>[0] & {
      type: unknown;
      declText: string;
    },
  ) => void;
  readsNoUsableTypes: (
    params: Parameters<typeof externalSignatureReadGlobalDeclarationBroker>[0],
  ) => void;
  wasWritten: () => boolean;
  // The payload the broker cached. One call writes exactly one file, into
  // `<cacheDir>/global-signatures/`, so that directory is the address. The file's own NAME is a hash of
  // the declaration text the read returned, which is the very thing this broker derives, so a test
  // cannot name it up front without re-deriving it.
  getWrittenPayload: () => unknown;
} => {
  // The cache existence check and atomic write run through the gateway wrappers with only their
  // underlying node calls mocked; the sha256 hasher runs REAL so the cache key is a true content hash;
  // the ts-morph global read is REPLACED wholesale so these tests cover caching only.
  const existsProxy = pathExistsProxy();
  const mkdirProxy = ensureDirProxy();
  const writeFileGateway = writeFileProxy();
  const renameGateway = renameProxy();
  externalSignatureReadGlobalDeclarationBrokerProxy();

  const readHandle = registerMock({ fn: externalSignatureReadGlobalDeclarationBroker });

  return {
    cacheMiss: (address): void => {
      const cachePath = cachePathFor(address);
      existsProxy.missing({ path: cachePath });
      mkdirProxy.succeeds({ path: `${address.cacheDir}/global-signatures` });
      writeFileGateway.succeeds({ path: `${cachePath}.tmp` });
      renameGateway.succeeds({ from: `${cachePath}.tmp`, to: cachePath });
    },
    cacheHit: (address): void => {
      existsProxy.present({ path: cachePathFor(address) });
    },
    readsSignature: ({ tsConfigFilePath, reference, signature, declText }): void => {
      readHandle
        .calledWith([{ tsConfigFilePath, reference }])
        .returns({ usable: true, result: 'signature', signature, declText });
    },
    readsType: ({ tsConfigFilePath, reference, type, declText }): void => {
      readHandle
        .calledWith([{ tsConfigFilePath, reference }])
        .returns({ usable: true, result: 'type', type, declText });
    },
    readsNoUsableTypes: ({ tsConfigFilePath, reference }): void => {
      readHandle.calledWith([{ tsConfigFilePath, reference }]).returns({ usable: false });
    },
    wasWritten: (): boolean =>
      writeFileGateway.getCallsFor({ path: isGlobalSignatureCachePath }).length > 0,
    getWrittenPayload: (): unknown =>
      JSON.parse(
        String(writeFileGateway.getCallsFor({ path: isGlobalSignatureCachePath }).at(-1)?.[1]),
      ),
  };
};
