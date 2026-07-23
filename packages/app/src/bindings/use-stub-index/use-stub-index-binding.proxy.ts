import { stubIndexFetchBrokerProxy } from '../../brokers/stub-index/fetch/stub-index-fetch-broker.proxy';
import type { StubViewStub } from '@assayer/shared/contracts';

export const useStubIndexBindingProxy = (): {
  setupView: (params: { view: ReturnType<typeof StubViewStub> }) => void;
  rejects: (params: { error: Error }) => void;
} => {
  const brokerProxy = stubIndexFetchBrokerProxy();

  return {
    setupView: ({ view }: { view: ReturnType<typeof StubViewStub> }): void => {
      brokerProxy.setupView({ view });
    },
    rejects: ({ error }: { error: Error }): void => {
      brokerProxy.rejects({ error });
    },
  };
};
