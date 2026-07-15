import { registerMock } from '@dungeonmaster/testing/register-mock';
import { configLoadBroker } from '@assayer/core/brokers';
import { configLoadBrokerProxy, compileResolveRootBrokerProxy } from '@assayer/core/testing';
import { AssayerConfigStub } from '@assayer/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';

export const repoSourceRootBrokerProxy = (): {
  configHasRepoRoot: ({ repoRoot }: { repoRoot: string }) => void;
  configUnreadable: ({ message }: { message: string }) => void;
} => {
  // Bare-called for enforce-proxy-child-creation. compileResolveRootBroker is left to run for real:
  // it is pure path arithmetic, and mocking it would hide the configDir-vs-root distinction the
  // tests exist to pin.
  configLoadBrokerProxy();
  compileResolveRootBrokerProxy();

  const handle = registerMock({ fn: configLoadBroker });

  handle.mockResolvedValue({ success: true, data: AssayerConfigStub() });

  return {
    configHasRepoRoot: ({ repoRoot }: { repoRoot: string }): void => {
      handle.mockResolvedValue({ success: true, data: AssayerConfigStub({ repoRoot }) });
    },
    configUnreadable: ({ message }: { message: string }): void => {
      handle.mockResolvedValue({
        success: false,
        message: errorMessageContract.parse(message),
        line: 1,
        column: 1,
      });
    },
  };
};
