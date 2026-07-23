import { assayerBridgeGetStubsAdapterProxy } from '../../../adapters/assayer-bridge/get-stubs/assayer-bridge-get-stubs-adapter.proxy';
import type { StubViewStub } from '@assayer/shared/contracts';

export const stubIndexFetchBrokerProxy = (): {
  setupView: (params: { view: ReturnType<typeof StubViewStub> }) => void;
  rejects: (params: { error: Error }) => void;
} => {
  const adapterProxy = assayerBridgeGetStubsAdapterProxy();

  return {
    setupView: ({ view }: { view: ReturnType<typeof StubViewStub> }): void => {
      adapterProxy.returns({ view });
    },
    rejects: ({ error }: { error: Error }): void => {
      adapterProxy.rejects({ error });
    },
  };
};
