import { registerMock } from '@dungeonmaster/testing/register-mock';
import { contentHashContract } from '@assayer/shared/contracts';

import { tsconfigReadBroker } from '../../tsconfig/read/tsconfig-read-broker';
import { tsconfigReadBrokerProxy } from '../../tsconfig/read/tsconfig-read-broker.proxy';
import { externalSignatureReadBrokerProxy } from '../../external-signature/read/external-signature-read-broker.proxy';
import { externalSignatureReadGlobalBroker } from '../../external-signature/read-global/external-signature-read-global-broker';
import { externalSignatureReadGlobalBrokerProxy } from '../../external-signature/read-global/external-signature-read-global-broker.proxy';
import { resolveSpecifierLayerBrokerProxy } from './resolve-specifier-layer-broker.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

const EMPTY_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

export const compileResolveGraphBrokerProxy = (): {
  // `path` is the blob file the broker reads: `<blobsDir>/<contentHash>.json`. One-shot, so two blobs
  // queued for the same path are read in the order queued.
  queueBlob: ({ path, blob }: { path: string; blob: unknown }) => void;
  // The tsconfig search starts at `root`. No tsconfig is found there, so the options are empty and
  // external type reading is skipped.
  noTsconfigAt: ({ root }: { root: string }) => void;
  configHash: ({ root, tsconfigHash }: { root: string; tsconfigHash: string }) => void;
  // A tsconfig is found at `path`. It is the second condition, beside a supplied `cacheDir`, that turns
  // on external and global signature reading.
  configFilePath: ({ root, path }: { root: string; path: string }) => void;
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
  tsconfigReadBrokerProxy();
  const layerProxy = resolveSpecifierLayerBrokerProxy();
  const packageSignatureProxy = externalSignatureReadBrokerProxy();
  externalSignatureReadGlobalBrokerProxy();

  // The tsconfig reader stays replaced: it runs `ts.findConfigFile` over `ts.sys`, which reads the real
  // disk, and no gateway proxy can stage `ts.sys`. It is staged by the search path the broker passes.
  const readConfigHandle = registerMock({ fn: tsconfigReadBroker });

  // The global read stays replaced: its proxy exposes no way to count reads, and counting them is the
  // only way to prove each distinct global is read once. It is staged by the full reference it is asked.
  const externalGlobalHandle = registerMock({ fn: externalSignatureReadGlobalBroker });

  return {
    queueBlob: ({ path, blob }: { path: string; blob: unknown }): void => {
      readFileGateway.returnsOnce({ path, contents: JSON.stringify(blob) });
    },
    noTsconfigAt: ({ root }: { root: string }): void => {
      readConfigHandle
        .calledWith([{ searchPath: root }])
        .returns({ options: {}, tsconfigHash: contentHashContract.parse(EMPTY_HASH) });
    },
    configHash: ({ root, tsconfigHash }: { root: string; tsconfigHash: string }): void => {
      readConfigHandle
        .calledWith([{ searchPath: root }])
        .returns({ options: {}, tsconfigHash: contentHashContract.parse(tsconfigHash) });
    },
    configFilePath: ({ root, path }: { root: string; path: string }): void => {
      readConfigHandle.calledWith([{ searchPath: root }]).returns({
        options: {},
        tsconfigHash: contentHashContract.parse(EMPTY_HASH),
        configFilePath: path,
      });
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
