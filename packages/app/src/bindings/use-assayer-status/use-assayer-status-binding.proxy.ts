import { statusFetchBrokerProxy } from '../../brokers/status/fetch/status-fetch-broker.proxy';
import type { StatusViewStub } from '../../contracts/status-view/status-view.stub';

export const useAssayerStatusBindingProxy = (): {
  setupStatus: (params: { status: ReturnType<typeof StatusViewStub> }) => void;
} => {
  const brokerProxy = statusFetchBrokerProxy();

  return {
    setupStatus: ({ status }: { status: ReturnType<typeof StatusViewStub> }): void => {
      brokerProxy.setupStatus({ status });
    },
  };
};
