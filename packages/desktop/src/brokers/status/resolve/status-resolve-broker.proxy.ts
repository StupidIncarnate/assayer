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

  // The broker calls each at most once per resolve, so there is no second real call either handle
  // could confuse it with — `calledWith([])` is a blanket match on purpose, not a stand-in for a real
  // argument.
  findHandle.calledWith([]).resolves({
    found: true,
    configDir: filePathContract.parse('/repo'),
    configPath: filePathContract.parse('/repo/assayer.config.json'),
  });
  loadHandle.calledWith([]).resolves({ success: true, data: AssayerConfigStub() });

  return {
    configRunMode: ({ runMode }: { runMode: 'thorough' | 'intelligent' }): void => {
      loadHandle.calledWith([]).resolves({ success: true, data: AssayerConfigStub({ runMode }) });
    },
    configAbsent: (): void => {
      findHandle.calledWith([]).resolves({ found: false });
    },
  };
};
