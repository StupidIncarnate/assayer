import { registerMock } from '@dungeonmaster/testing/register-mock';
import { fileCountContract, ContentHashStub } from '@assayer/shared/contracts';
import type { FileCount , AssayerConfigStub} from '@assayer/shared/contracts';
import type { FilePath } from '@assayer/core/contracts';
import { analyzerHashBroker } from '@assayer/core/brokers';
import { analyzerHashBrokerProxy } from '@assayer/core/testing';

import { ConfigResolveLayerResponder } from './config-resolve-layer-responder';
import { ConfigResolveLayerResponderProxy } from './config-resolve-layer-responder.proxy';
import { StableBranchLayerResponder } from './stable-branch-layer-responder';
import { StableBranchLayerResponderProxy } from './stable-branch-layer-responder.proxy';
import { CompileRunLayerResponder } from './compile-run-layer-responder';
import { CompileRunLayerResponderProxy } from './compile-run-layer-responder.proxy';
import { analyzerRootsResolveAdapterProxy } from '../../../adapters/analyzer-roots/resolve/analyzer-roots-resolve-adapter.proxy';
import { CliExactOutputError } from '../../../errors/cli-exact-output/cli-exact-output-error';

type AssayerConfig = ReturnType<typeof AssayerConfigStub>;

export const PrecheckRunResponderProxy = (): {
  resolvesConfig: (params: { config: AssayerConfig; configDir: FilePath; configPath: FilePath }) => void;
  throwsConfigError: (params: { message: string }) => void;
  stableReturns: (params: { config: AssayerConfig }) => void;
  compileSucceeds: () => void;
  stableCallCount: () => FileCount;
  compileCallCount: () => FileCount;
  getCompileRunArgs: () => unknown;
} => {
  // Bare-called to satisfy enforce-proxy-child-creation. analyzerHashBroker is a cross-package
  // core broker the responder calls directly, so (like the layer responders below) we registerMock
  // it directly to give it a deterministic hash — the analyzerRootsResolveAdapter it consumes is a
  // pure __dirname path computation with no I/O, so it is left to run for real.
  analyzerHashBrokerProxy();
  analyzerRootsResolveAdapterProxy();

  // The three layer-responder proxies below are also bare-called only to satisfy
  // enforce-proxy-child-creation: they wire registerMock onto the CORE BROKERS each layer
  // responder calls internally, but since we registerMock the layer responders themselves
  // directly below (replacing their entire implementation), those real bodies never run in
  // this proxy's tests — the broker-level mocks they set up are inert.
  ConfigResolveLayerResponderProxy();
  StableBranchLayerResponderProxy();
  CompileRunLayerResponderProxy();

  const analyzerHashHandle = registerMock({ fn: analyzerHashBroker });
  const configResolveHandle = registerMock({ fn: ConfigResolveLayerResponder });
  const stableBranchHandle = registerMock({ fn: StableBranchLayerResponder });
  const compileRunHandle = registerMock({ fn: CompileRunLayerResponder });

  analyzerHashHandle.mockResolvedValue(ContentHashStub());
  stableBranchHandle.mockImplementation(async ({ config }: { config: AssayerConfig }) => Promise.resolve(config));
  compileRunHandle.mockResolvedValue(undefined);

  return {
    resolvesConfig: ({ config, configDir, configPath }: { config: AssayerConfig; configDir: FilePath; configPath: FilePath }): void => {
      configResolveHandle.mockResolvedValueOnce({ config, configDir, configPath });
    },
    throwsConfigError: ({ message }: { message: string }): void => {
      configResolveHandle.mockRejectedValueOnce(new CliExactOutputError({ message }));
    },
    stableReturns: ({ config }: { config: AssayerConfig }): void => {
      stableBranchHandle.mockResolvedValueOnce(config);
    },
    compileSucceeds: (): void => {
      compileRunHandle.mockResolvedValueOnce(undefined);
    },
    stableCallCount: (): FileCount => fileCountContract.parse(stableBranchHandle.mock.calls.length),
    compileCallCount: (): FileCount => fileCountContract.parse(compileRunHandle.mock.calls.length),
    getCompileRunArgs: (): unknown => compileRunHandle.mock.calls.at(-1)?.[0],
  };
};
