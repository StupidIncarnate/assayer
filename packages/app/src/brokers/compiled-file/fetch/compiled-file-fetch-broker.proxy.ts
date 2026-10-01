import { window } from '#gateway/browser/window';
import { CompiledFileViewStub, RelPathStub } from '@assayer/shared/contracts';

export const compiledFileFetchBrokerProxy = (): {
  setupFile: (params: { relPath: string; fileView: ReturnType<typeof CompiledFileViewStub> }) => void;
  fails: () => void;
} => {
  const registry = new Map<ReturnType<typeof RelPathStub>, ReturnType<typeof CompiledFileViewStub>>();
  window.assayerBridge = {
    ...window.assayerBridge,
    getCompiledFile: async ({ relPath }: { relPath: string }): Promise<unknown> => {
      const view = registry.get(RelPathStub({ value: relPath }));
      return Promise.resolve(view ?? CompiledFileViewStub({ relPath }));
    },
  };
  const adapterProxy = {
    register: ({ relPath, fileView }: { relPath: string; fileView: ReturnType<typeof CompiledFileViewStub> }): void => {
      registry.set(RelPathStub({ value: relPath }), fileView);
    },
    absent: (): void => {
      const bridge = window.assayerBridge;
      if (bridge !== undefined) {
        Reflect.deleteProperty(bridge, 'getCompiledFile');
      }
    },
  };

  return {
    setupFile: ({ relPath, fileView }: { relPath: string; fileView: ReturnType<typeof CompiledFileViewStub> }): void => {
      adapterProxy.register({ relPath, fileView });
    },
    fails: (): void => {
      adapterProxy.absent();
    },
  };
};
