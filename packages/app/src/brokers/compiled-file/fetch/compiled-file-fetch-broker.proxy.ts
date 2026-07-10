import { assayerBridgeGetCompiledFileAdapterProxy } from '../../../adapters/assayer-bridge/get-compiled-file/assayer-bridge-get-compiled-file-adapter.proxy';
import type { CompiledFileViewStub } from '@assayer/shared/contracts';

export const compiledFileFetchBrokerProxy = (): {
  setupFile: (params: { relPath: string; fileView: ReturnType<typeof CompiledFileViewStub> }) => void;
  fails: () => void;
} => {
  const adapterProxy = assayerBridgeGetCompiledFileAdapterProxy();

  return {
    setupFile: ({ relPath, fileView }: { relPath: string; fileView: ReturnType<typeof CompiledFileViewStub> }): void => {
      adapterProxy.register({ relPath, fileView });
    },
    fails: (): void => {
      adapterProxy.absent();
    },
  };
};
