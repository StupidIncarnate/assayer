import { assayerBridgeGetStatusAdapterProxy } from '../../../adapters/assayer-bridge/get-status/assayer-bridge-get-status-adapter.proxy';
import type { StatusViewStub } from '../../../contracts/status-view/status-view.stub';

export const statusFetchBrokerProxy = (): {
  setupStatus: (params: { status: ReturnType<typeof StatusViewStub> }) => void;
} => {
  const adapterProxy = assayerBridgeGetStatusAdapterProxy();

  return {
    setupStatus: ({ status }: { status: ReturnType<typeof StatusViewStub> }): void => {
      adapterProxy.returns({ status });
    },
  };
};
