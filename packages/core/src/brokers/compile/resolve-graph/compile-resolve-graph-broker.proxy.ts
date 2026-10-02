import { registerMock } from '@dungeonmaster/testing/register-mock';

import type { CompilerOptions } from '#gateway/npm/typescript';

import { tsconfigOwnerBrokerProxy } from '../../tsconfig/owner/tsconfig-owner-broker.proxy';
import { externalSignatureReadBrokerProxy } from '../../external-signature/read/external-signature-read-broker.proxy';
import { externalSignatureReadGlobalBroker } from '../../external-signature/read-global/external-signature-read-global-broker';
import { externalSignatureReadGlobalBrokerProxy } from '../../external-signature/read-global/external-signature-read-global-broker.proxy';
import { resolveSpecifierLayerBrokerProxy } from './resolve-specifier-layer-broker.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

export const compileResolveGraphBrokerProxy = (): {
  // `path` is the blob file the broker reads: `<blobsDir>/<analysisHash>.json`. One-shot, so two blobs
  // queued for the same path are read in the order queued.
  queueBlob: ({ path, blob }: { path: string; blob: unknown }) => void;
  // No tsconfig owns these files under `root`, so they resolve under TypeScript's defaults and external
  // type reading is skipped for their imports.
  filesWithoutOwner: ({ root, relPaths }: { root: string; relPaths: readonly string[] }) => void;
  // One tsconfig at `configFilePath` owns these files, with `options`. An owner is the second condition,
  // beside a supplied `cacheDir`, that turns on external and global signature reading for a file's imports.
  filesOwnedBy: ({
    root,
    relPaths,
    configFilePath,
    options,
  }: {
    root: string;
    relPaths: readonly string[];
    configFilePath: string;
    options: CompilerOptions;
  }) => void;
  resolvesLocal: ({ specifier, fileName }: { specifier: string; fileName: string }) => void;
  resolvesUnresolved: ({ specifier }: { specifier: string }) => void;
  // A package export's signature is not cached yet. The broker reads the `.d.ts` bytes, reads the
  // signature through the declaration reader, and writes it to the cache.
  packageSignatureCacheMiss: (params: {
    dtsPath: string;
    dtsContent: string;
    exportName: string;
    cacheDir: string;
    signature: unknown;
  }) => void;
  // How many times the declaration reader ran. Each distinct export is read exactly once, however many
  // files import it.
  packageSignatureReadCount: () => number;
  // A global reference (`process.env`, `console.log`) has no usable types.
  globalReadsNothing: (params: {
    tsConfigFilePath: string;
    cacheDir: string;
    name: string;
    member?: string;
    called: boolean;
  }) => void;
  // Each call's own arguments under one cache directory, so a test can prove each distinct global is
  // read exactly once.
  getExternalSignatureReadGlobalCalls: ({ cacheDir }: { cacheDir: string }) => readonly unknown[];
} => {
  // Each queued blob is one file's on-disk record, answered to a read of its exact path. The builtins
  // list and the sha256 hasher run REAL. The package signature read runs REAL through its own proxy.
  const readFileGateway = readFileProxy();
  const ownerProxy = tsconfigOwnerBrokerProxy();
  const layerProxy = resolveSpecifierLayerBrokerProxy();
  const packageSignatureProxy = externalSignatureReadBrokerProxy();
  externalSignatureReadGlobalBrokerProxy();

  // The global read stays replaced: its proxy exposes no way to count reads, and counting them is the
  // only way to prove each distinct global is read once. It is staged by the full reference it is asked.
  const externalGlobalHandle = registerMock({ fn: externalSignatureReadGlobalBroker });

  return {
    queueBlob: ({ path, blob }: { path: string; blob: unknown }): void => {
      readFileGateway.returnsOnce({ path, contents: JSON.stringify(blob) });
    },
    filesWithoutOwner: ({ root, relPaths }: { root: string; relPaths: readonly string[] }): void => {
      ownerProxy.filesWithoutOwner({ absPaths: relPaths.map((relPath) => `${root}/${relPath}`) });
    },
    filesOwnedBy: ({
      root,
      relPaths,
      configFilePath,
      options,
    }: {
      root: string;
      relPaths: readonly string[];
      configFilePath: string;
      options: CompilerOptions;
    }): void => {
      ownerProxy.filesOwnedBy({ absPaths: relPaths.map((relPath) => `${root}/${relPath}`), configFilePath, options });
    },
    resolvesLocal: ({ specifier, fileName }: { specifier: string; fileName: string }): void => {
      layerProxy.resolvesLocal({ specifier, fileName });
    },
    resolvesUnresolved: ({ specifier }: { specifier: string }): void => {
      layerProxy.resolvesUnresolved({ specifier });
    },
    packageSignatureCacheMiss: ({
      dtsPath,
      dtsContent,
      exportName,
      cacheDir,
      signature,
    }: {
      dtsPath: string;
      dtsContent: string;
      exportName: string;
      cacheDir: string;
      signature: unknown;
    }): void => {
      packageSignatureProxy.cacheMiss({ dtsPath, dtsContent, exportName, cacheDir });
      packageSignatureProxy.readsSignature({ exportName, signature });
    },
    packageSignatureReadCount: (): number => packageSignatureProxy.signatureReadCount(),
    globalReadsNothing: ({
      tsConfigFilePath,
      cacheDir,
      name,
      member,
      called,
    }: {
      tsConfigFilePath: string;
      cacheDir: string;
      name: string;
      member?: string;
      called: boolean;
    }): void => {
      const reference = { kind: 'global', name, ...(member === undefined ? {} : { member }), called };
      externalGlobalHandle.calledWith([{ tsConfigFilePath, reference, cacheDir }]).resolves({ usable: false });
    },
    getExternalSignatureReadGlobalCalls: ({ cacheDir }: { cacheDir: string }): readonly unknown[] =>
      externalGlobalHandle.callsMatching([{ cacheDir }]).map((call) => call[0]),
  };
};
