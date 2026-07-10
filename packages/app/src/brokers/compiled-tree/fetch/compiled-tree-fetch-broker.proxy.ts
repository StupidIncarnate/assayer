import { assayerBridgeGetCompiledTreeAdapterProxy } from '../../../adapters/assayer-bridge/get-compiled-tree/assayer-bridge-get-compiled-tree-adapter.proxy';
import type { CompiledTreeStub } from '@assayer/shared/contracts';

export const compiledTreeFetchBrokerProxy = (): {
  setupTree: (params: { tree: ReturnType<typeof CompiledTreeStub> }) => void;
  rejects: (params: { error: Error }) => void;
} => {
  const adapterProxy = assayerBridgeGetCompiledTreeAdapterProxy();

  return {
    setupTree: ({ tree }: { tree: ReturnType<typeof CompiledTreeStub> }): void => {
      adapterProxy.returns({ tree });
    },
    rejects: ({ error }: { error: Error }): void => {
      adapterProxy.rejects({ error });
    },
  };
};
