import { forkWorkerProxy } from '../fork-worker/fork-worker.proxy';

export const closeForkWorkersProxy = (): {
  repliesWith: ReturnType<typeof forkWorkerProxy>['repliesWith'];
  getForkCalls: ReturnType<typeof forkWorkerProxy>['getForkCalls'];
  getKillSignals: ReturnType<typeof forkWorkerProxy>['getKillSignals'];
} => {
  const forkProxy = forkWorkerProxy();

  return {
    repliesWith: forkProxy.repliesWith,
    getForkCalls: forkProxy.getForkCalls,
    getKillSignals: forkProxy.getKillSignals,
  };
};
