import { registerMock } from '@dungeonmaster/testing/register-mock';
import { fileCountContract } from '@assayer/shared/contracts';
import type { FileCount , AssayerConfigStub} from '@assayer/shared/contracts';
import type { FilePath } from '@assayer/core/contracts';

import { ConfigResolveLayerResponder } from './config-resolve-layer-responder';
import { ConfigResolveLayerResponderProxy } from './config-resolve-layer-responder.proxy';
import { StableBranchLayerResponder } from './stable-branch-layer-responder';
import { StableBranchLayerResponderProxy } from './stable-branch-layer-responder.proxy';
import { CompileRunLayerResponder } from './compile-run-layer-responder';
import { CompileRunLayerResponderProxy } from './compile-run-layer-responder.proxy';
import { packageJsonReadAdapterProxy } from '../../../adapters/package-json/read/package-json-read-adapter.proxy';
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
  // packageJsonReadAdapterProxy is a same-package relative import, so the ts-jest proxy-mock
  // AST collector CAN walk into it and hoist the nested registerMock(readFile) call it sets up
  // — unlike the cross-package "@assayer/core/testing" composed proxies in the sibling layer
  // proxies, which are bare-called only to satisfy enforce-proxy-child-creation and never
  // actually intercept I/O. Here the bare call is what makes the REAL packageJsonReadAdapter
  // (never mocked itself — the responder imports and calls it directly) resolve to '1.0.0'.
  packageJsonReadAdapterProxy();

  // The three layer-responder proxies below are also bare-called only to satisfy
  // enforce-proxy-child-creation: they wire registerMock onto the CORE BROKERS each layer
  // responder calls internally, but since we registerMock the layer responders themselves
  // directly below (replacing their entire implementation), those real bodies never run in
  // this proxy's tests — the broker-level mocks they set up are inert.
  ConfigResolveLayerResponderProxy();
  StableBranchLayerResponderProxy();
  CompileRunLayerResponderProxy();

  const configResolveHandle = registerMock({ fn: ConfigResolveLayerResponder });
  const stableBranchHandle = registerMock({ fn: StableBranchLayerResponder });
  const compileRunHandle = registerMock({ fn: CompileRunLayerResponder });

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
