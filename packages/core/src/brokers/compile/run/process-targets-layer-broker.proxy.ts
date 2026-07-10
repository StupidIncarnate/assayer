import type { FileCount } from '@assayer/shared/contracts';

import { compileProcessFileBrokerProxy } from '../process-file/compile-process-file-broker.proxy';

export const processTargetsLayerBrokerProxy = (): {
  queueCleanWrite: () => void;
  processedCount: () => FileCount;
} => {
  const processFileProxy = compileProcessFileBrokerProxy();

  return {
    queueCleanWrite: (): void => {
      processFileProxy.blobMissing();
    },
    processedCount: (): FileCount => processFileProxy.processedCount(),
  };
};
