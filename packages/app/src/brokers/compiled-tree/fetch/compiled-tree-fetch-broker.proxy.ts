import { window } from '#gateway/browser/window';
import { CompiledTreeStub } from '@assayer/shared/contracts';

export const compiledTreeFetchBrokerProxy = (): {
  setupTree: (params: { tree: ReturnType<typeof CompiledTreeStub> }) => void;
  rejects: (params: { error: Error }) => void;
} => {
  window.assayerBridge = {
    ...window.assayerBridge,
    getCompiledTree: async (): Promise<unknown> => Promise.resolve(CompiledTreeStub()),
  };
  const adapterProxy = {
    returns: ({ tree }: { tree: ReturnType<typeof CompiledTreeStub> }): void => {
      window.assayerBridge = {
        ...window.assayerBridge,
        getCompiledTree: async (): Promise<unknown> => Promise.resolve(tree),
      };
    },
    rejects: ({ error }: { error: Error }): void => {
      window.assayerBridge = {
        ...window.assayerBridge,
        getCompiledTree: async (): Promise<unknown> => Promise.reject(error),
      };
    },
    absent: (): void => {
      const bridge = window.assayerBridge;
      if (bridge !== undefined) {
        Reflect.deleteProperty(bridge, 'getCompiledTree');
      }
    },
  };

  return {
    setupTree: ({ tree }: { tree: ReturnType<typeof CompiledTreeStub> }): void => {
      adapterProxy.returns({ tree });
    },
    rejects: ({ error }: { error: Error }): void => {
      adapterProxy.rejects({ error });
    },
  };
};
