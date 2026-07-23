import { registerMock } from '@dungeonmaster/testing/register-mock';
import { configFindBroker, configLoadBroker } from '@assayer/core/brokers';
import { statusGetBrokerProxy, configFindBrokerProxy, configLoadBrokerProxy } from '@assayer/core/testing';
import { AssayerConfigStub } from '@assayer/shared/contracts';
import { filePathContract } from '@assayer/core/contracts';

export const statusResolveBrokerProxy = (): {
  configRunMode: (params: { runMode: 'thorough' | 'intelligent' }) => void;
  configAbsent: () => void;
} => {
  statusGetBrokerProxy();
  // Bare-called for enforce-proxy-child-creation; overridden below so the broker never touches disk.
  configFindBrokerProxy();
  configLoadBrokerProxy();

  const findHandle = registerMock({ fn: configFindBroker });
  const loadHandle = registerMock({ fn: configLoadBroker });

  findHandle.mockResolvedValue({
    found: true,
    configDir: filePathContract.parse('/repo'),
    configPath: filePathContract.parse('/repo/assayer.config.json'),
  });
  loadHandle.mockResolvedValue({ success: true, data: AssayerConfigStub() });

  return {
    configRunMode: ({ runMode }: { runMode: 'thorough' | 'intelligent' }): void => {
      loadHandle.mockResolvedValue({ success: true, data: AssayerConfigStub({ runMode }) });
    },
    configAbsent: (): void => {
      findHandle.mockResolvedValue({ found: false });
    },
  };
};
