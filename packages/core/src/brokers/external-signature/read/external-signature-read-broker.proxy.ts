import { registerMock } from '@dungeonmaster/testing/register-mock';
import { fileCountContract } from '@assayer/shared/contracts';
import type { FileCount } from '@assayer/shared/contracts';

import { externalSignatureReadDeclarationBroker } from '../read-declaration/external-signature-read-declaration-broker';
import { externalSignatureReadDeclarationBrokerProxy } from '../read-declaration/external-signature-read-declaration-broker.proxy';
import { createHash } from '#gateway/node/crypto';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { renameProxy } from '#gateway/node/fs__promises/rename/rename.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';

const isSignatureCachePath = (value: unknown): boolean =>
  String(value).includes('/external-signatures/');

const cachePathFor = ({
  dtsContent,
  exportName,
  cacheDir,
}: {
  dtsContent: string;
  exportName: string;
  cacheDir: string;
}): string => {
  const declHash = createHash('sha256').update(`${exportName}\n${dtsContent}`, 'utf8').digest('hex');

  return `${cacheDir}/external-signatures/${declHash}.json`;
};

export const externalSignatureReadBrokerProxy = (): {
  cacheMiss: (params: {
    dtsPath: string;
    dtsContent: string;
    exportName: string;
    cacheDir: string;
  }) => void;
  cacheHit: (params: {
    dtsPath: string;
    dtsContent: string;
    exportName: string;
    cacheDir: string;
    signatureJson: string;
  }) => void;
  readsSignature: ({ exportName, signature }: { exportName: string; signature: unknown }) => void;
  readsNoUsableTypes: ({ exportName }: { exportName: string }) => void;
  signatureReadCount: () => FileCount;
  wasWritten: () => boolean;
  // The signature the broker cached. One call writes exactly one file, into
  // `<cacheDir>/external-signatures/`, so that directory is the address. The file's own NAME is a hash
  // of the `.d.ts` bytes, which a test reads back through this method instead of re-deriving it.
  getWrittenSignature: () => unknown;
} => {
  // The `.d.ts` byte read, existence check, and atomic write run through the gateway wrappers with
  // only their underlying node calls mocked; the sha256 hasher runs REAL so the cache key is a true
  // content hash; the ts-morph read is REPLACED wholesale so the broker's own tests cover caching,
  // not type reading (the adapter's tests cover that).
  const readFileGateway = readFileProxy();
  const existsProxy = pathExistsProxy();
  const mkdirProxy = ensureDirProxy();
  const writeFileGateway = writeFileProxy();
  const renameGateway = renameProxy();
  externalSignatureReadDeclarationBrokerProxy();

  const readHandle = registerMock({ fn: externalSignatureReadDeclarationBroker });

  return {
    cacheMiss: ({ dtsPath, dtsContent, exportName, cacheDir }): void => {
      const cachePath = cachePathFor({ dtsContent, exportName, cacheDir });
      readFileGateway.returns({ path: dtsPath, contents: dtsContent });
      existsProxy.missing({ path: cachePath });
      mkdirProxy.succeeds({ path: `${cacheDir}/external-signatures` });
      writeFileGateway.succeeds({ path: `${cachePath}.tmp` });
      renameGateway.succeeds({ from: `${cachePath}.tmp`, to: cachePath });
    },
    cacheHit: ({ dtsPath, dtsContent, exportName, cacheDir, signatureJson }): void => {
      const cachePath = cachePathFor({ dtsContent, exportName, cacheDir });
      readFileGateway.returns({ path: dtsPath, contents: dtsContent });
      existsProxy.present({ path: cachePath });
      readFileGateway.returns({ path: cachePath, contents: signatureJson });
    },
    readsSignature: ({ exportName, signature }: { exportName: string; signature: unknown }): void => {
      readHandle.calledWith([{ exportName }]).returns({ usable: true, signature });
    },
    readsNoUsableTypes: ({ exportName }: { exportName: string }): void => {
      readHandle.calledWith([{ exportName }]).returns({ usable: false });
    },
    signatureReadCount: (): FileCount => fileCountContract.parse(readHandle.callsMatching([]).length),
    wasWritten: (): boolean =>
      writeFileGateway.getCallsFor({ path: isSignatureCachePath }).length > 0,
    getWrittenSignature: (): unknown =>
      JSON.parse(String(writeFileGateway.getCallsFor({ path: isSignatureCachePath }).at(-1)?.[1])),
  };
};
