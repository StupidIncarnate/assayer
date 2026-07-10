/**
 * WHY MOCK THE WINDOW GLOBAL: the adapter's I/O boundary is window.assayerBridge.getCompiledFile. The
 * proxy stands it up over jsdom, keyed by relPath so each requested path returns its own view, and MERGES
 * onto any existing window.assayerBridge so it composes with the getCompiledTree proxy.
 */
import { CompiledFileViewStub, RelPathStub } from '@assayer/shared/contracts';

export const assayerBridgeGetCompiledFileAdapterProxy = (): {
  register: (params: { relPath: string; fileView: ReturnType<typeof CompiledFileViewStub> }) => void;
  absent: () => void;
} => {
  const registry = new Map<ReturnType<typeof RelPathStub>, ReturnType<typeof CompiledFileViewStub>>();

  window.assayerBridge = {
    ...window.assayerBridge,
    getCompiledFile: async ({ relPath }: { relPath: string }): Promise<unknown> => {
      const view = registry.get(RelPathStub({ value: relPath }));
      return Promise.resolve(view ?? CompiledFileViewStub({ relPath }));
    },
  };

  return {
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
};
