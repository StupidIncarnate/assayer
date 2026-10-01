import { window } from '#gateway/browser/window';
import { CompiledFileViewStub } from '@assayer/shared/contracts/compiled-file-view/compiled-file-view.stub';

export const compiledFileFetchBrokerProxy = (): {
  setupFile: (params: { relPath: string; fileView: ReturnType<typeof CompiledFileViewStub> }) => void;
  fails: () => void;
} => {
  const registry = new Map<string, ReturnType<typeof CompiledFileViewStub>>();
  window.assayerBridge = {
    ...window.assayerBridge,
    getCompiledFile: async ({ relPath }: { relPath: string }): Promise<unknown> => {
      const view = registry.get(relPath);
      return Promise.resolve(view ?? CompiledFileViewStub({ relPath }));
    },
  };
  const adapterProxy = {
    register: ({ relPath, fileView }: { relPath: string; fileView: ReturnType<typeof CompiledFileViewStub> }): void => {
      registry.set(relPath, fileView);
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
