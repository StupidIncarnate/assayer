import { registerMock } from '@dungeonmaster/testing/register-mock';
import { contentHashContract } from '@assayer/shared/contracts';

import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { cryptoSha256AdapterProxy } from '../../../adapters/crypto/sha256/crypto-sha256-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { nodeModuleBuiltinsAdapterProxy } from '../../../adapters/node-module/builtins/node-module-builtins-adapter.proxy';
import { typescriptReadConfigAdapter } from '../../../adapters/typescript/read-config/typescript-read-config-adapter';
import { typescriptReadConfigAdapterProxy } from '../../../adapters/typescript/read-config/typescript-read-config-adapter.proxy';
import { externalSignatureReadBroker } from '../../external-signature/read/external-signature-read-broker';
import { externalSignatureReadBrokerProxy } from '../../external-signature/read/external-signature-read-broker.proxy';
import { externalSignatureReadGlobalBroker } from '../../external-signature/read-global/external-signature-read-global-broker';
import { externalSignatureReadGlobalBrokerProxy } from '../../external-signature/read-global/external-signature-read-global-broker.proxy';
import { resolveSpecifierLayerBrokerProxy } from './resolve-specifier-layer-broker.proxy';

const EMPTY_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

export const compileResolveGraphBrokerProxy = (): {
  queueBlob: ({ blob }: { blob: unknown }) => void;
  configHash: ({ tsconfigHash }: { tsconfigHash: string }) => void;
  // Sets the tsconfig's own config-file path, the second condition (alongside a supplied `cacheDir`)
  // that gates external/global signature reading on -- unset in every other test, so those reads stay
  // silent unless a test opts in, exactly as the comment below states.
  configFilePath: ({ path }: { path: string }) => void;
  resolvesLocal: ({ fileName }: { fileName: string }) => void;
  resolvesLocalOnce: ({ fileName }: { fileName: string }) => void;
  resolvesUnresolved: () => void;
  // Exposes each call's own arguments (never a synthesized index), the only way to pin the "exactly
  // once, keyed by cache identity, never once per importer" dedup invariant -- these two callees are
  // replaced wholesale, so their real implementations (covered by their own tests) never run here to
  // produce an observable side effect.
  getExternalSignatureReadCalls: () => readonly unknown[];
  getExternalSignatureReadGlobalCalls: () => readonly unknown[];
} => {
  // Blob loading runs through the REAL fsReadFileAdapter with only the underlying readFile mocked, so
  // a composing broker's own source reads keep working (the adapter module is not auto-replaced). Each
  // queued blob is one file's on-disk record. Config reading is mocked to a fixed tsconfigHash; module
  // resolution is staged through the layer proxy; the builtins list and the sha256 hasher run REAL.
  const readFileProxy = fsReadFileAdapterProxy();
  typescriptReadConfigAdapterProxy();
  nodeModuleBuiltinsAdapterProxy();
  cryptoSha256AdapterProxy();
  const layerProxy = resolveSpecifierLayerBrokerProxy();

  const readConfigHandle = registerMock({ fn: typescriptReadConfigAdapter });
  readConfigHandle.calledWith([]).returns({ options: {}, tsconfigHash: contentHashContract.parse(EMPTY_HASH) });

  // External type reading is REPLACED wholesale (its own broker tests cover caching); this broker's
  // tests drive classification, so it stays silent unless a test opts into a cache dir.
  externalSignatureReadBrokerProxy();
  const externalHandle = registerMock({ fn: externalSignatureReadBroker });
  externalHandle.calledWith([]).resolves({ usable: false });

  // Global/ambient reading is likewise replaced wholesale — its own broker tests cover caching, and
  // this broker's tests drive classification, so it stays silent unless a test opts into a cache dir.
  externalSignatureReadGlobalBrokerProxy();
  const externalGlobalHandle = registerMock({ fn: externalSignatureReadGlobalBroker });
  externalGlobalHandle.calledWith([]).resolves({ usable: false });

  return {
    queueBlob: ({ blob }: { blob: unknown }): void => {
      readFileProxy.returns({ content: JSON.stringify(blob) });
    },
    configHash: ({ tsconfigHash }: { tsconfigHash: string }): void => {
      readConfigHandle.calledWith([]).returns({ options: {}, tsconfigHash: contentHashContract.parse(tsconfigHash) });
    },
    configFilePath: ({ path }: { path: string }): void => {
      readConfigHandle.calledWith([]).returns({
        options: {},
        tsconfigHash: contentHashContract.parse(EMPTY_HASH),
        configFilePath: FilePathStub({ value: path }),
      });
    },
    resolvesLocal: ({ fileName }: { fileName: string }): void => {
      layerProxy.resolvesLocal({ fileName });
    },
    resolvesLocalOnce: ({ fileName }: { fileName: string }): void => {
      layerProxy.resolvesLocalOnce({ fileName });
    },
    resolvesUnresolved: (): void => {
      layerProxy.resolvesUnresolved();
    },
    getExternalSignatureReadCalls: (): readonly unknown[] => externalHandle.callsMatching([]).map((call) => call[0]),
    getExternalSignatureReadGlobalCalls: (): readonly unknown[] =>
      externalGlobalHandle.callsMatching([]).map((call) => call[0]),
  };
};
