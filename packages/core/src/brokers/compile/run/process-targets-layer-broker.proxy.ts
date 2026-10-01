import type { FileCount } from '@assayer/shared/contracts';

import { contentHashTransformer } from '../../../transformers/content-hash/content-hash-transformer';
import { compileProcessFileBrokerProxy } from '../process-file/compile-process-file-broker.proxy';

export const processTargetsLayerBrokerProxy = (): {
  // Stages the blob existence check and write for one target, addressed by the blob path the broker
  // derives from `blobsDir` and the content's hash.
  queueCleanWrite: ({ blobsDir, content }: { blobsDir: string; content: string }) => void;
  processedCount: () => FileCount;
} => {
  const processFileProxy = compileProcessFileBrokerProxy();

  return {
    queueCleanWrite: ({ blobsDir, content }: { blobsDir: string; content: string }): void => {
      processFileProxy.blobMissing({ blobsDir, contentHash: contentHashTransformer({ content }) });
    },
    processedCount: (): FileCount => processFileProxy.processedCount(),
  };
};
