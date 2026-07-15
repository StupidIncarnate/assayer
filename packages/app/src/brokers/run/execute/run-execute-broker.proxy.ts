import { assayerBridgeRunFileAdapterProxy } from '../../../adapters/assayer-bridge/run-file/assayer-bridge-run-file-adapter.proxy';
import type { RunResultStub } from '@assayer/shared/contracts';

export const runExecuteBrokerProxy = (): {
  setupRun: (params: { run: ReturnType<typeof RunResultStub> }) => void;
  fails: (params: { message: string }) => void;
} => {
  const adapterProxy = assayerBridgeRunFileAdapterProxy();

  return {
    setupRun: ({ run }: { run: ReturnType<typeof RunResultStub> }): void => {
      adapterProxy.returns({ run });
    },
    fails: ({ message }: { message: string }): void => {
      adapterProxy.fails({ message });
    },
  };
};
