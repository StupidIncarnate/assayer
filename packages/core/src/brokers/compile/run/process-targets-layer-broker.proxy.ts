import { analysisHashTransformer } from '../../../transformers/analysis-hash/analysis-hash-transformer';
import { compileProcessFileBrokerProxy } from '../process-file/compile-process-file-broker.proxy';

export const processTargetsLayerBrokerProxy = (): {
  // Stages the blob existence check and write for one target, addressed by the blob path the broker
  // derives from `blobsDir` and the target's analysis hash. No tsconfig owns the target at `absPath`, so its
  // analysis hash covers TypeScript's default options.
  queueCleanWrite: ({ blobsDir, absPath, content }: { blobsDir: string; absPath: string; content: string }) => void;
  processedCount: () => number;
} => {
  const processFileProxy = compileProcessFileBrokerProxy();

  return {
    queueCleanWrite: ({ blobsDir, absPath, content }: { blobsDir: string; absPath: string; content: string }): void => {
      processFileProxy.filesWithoutOwner({ absPaths: [absPath] });
      processFileProxy.blobMissing({ blobsDir, analysisHash: analysisHashTransformer({ content, options: {} }) });
    },
    processedCount: (): number => processFileProxy.processedCount(),
  };
};
