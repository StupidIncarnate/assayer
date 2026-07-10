import { compiledTreeFetchBrokerProxy } from '../../brokers/compiled-tree/fetch/compiled-tree-fetch-broker.proxy';
import type { CompiledTreeStub } from '@assayer/shared/contracts';

export const useCompiledTreeBindingProxy = (): {
  setupTree: (params: { tree: ReturnType<typeof CompiledTreeStub> }) => void;
  rejects: (params: { error: Error }) => void;
} => {
  const brokerProxy = compiledTreeFetchBrokerProxy();

  return {
    setupTree: ({ tree }: { tree: ReturnType<typeof CompiledTreeStub> }): void => {
      brokerProxy.setupTree({ tree });
    },
    rejects: ({ error }: { error: Error }): void => {
      brokerProxy.rejects({ error });
    },
  };
};
