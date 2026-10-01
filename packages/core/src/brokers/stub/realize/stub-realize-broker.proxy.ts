import { analyzeFileBrokerProxy } from '../../analyze/file/analyze-file-broker.proxy';
import { contentHashTransformerProxy } from '../../../transformers/content-hash/content-hash-transformer.proxy';
import { tsconfigReadBrokerProxy } from '../../tsconfig/read/tsconfig-read-broker.proxy';
import { resolveSiblingCalleeBrokerProxy } from '../../resolve-sibling/callee/resolve-sibling-callee-broker.proxy';

export const stubRealizeBrokerProxy = (): {
  setupTypeDefinition: ({ fileName, source }: { fileName: string; source: string }) => void;
} => {
  // The analyze, tsconfig read, and hash run REAL — the same real pipeline compose uses. Only the
  // sibling resolve is staged, because resolving a cross-file type against a real filesystem is exactly
  // what a unit test cannot do; the caller says where a specifier lands and what the definition's
  // source is instead.
  analyzeFileBrokerProxy();
  contentHashTransformerProxy();
  tsconfigReadBrokerProxy();
  const sibling = resolveSiblingCalleeBrokerProxy();

  return {
    // A cross-file type's definition both RESOLVES to `fileName` and READS back `source` — the pair a
    // cross-file object read needs. Queued once so several type definitions wire in read order.
    setupTypeDefinition: ({ fileName, source }: { fileName: string; source: string }): void => {
      sibling.resolvesToSibling({ fileName, source });
    },
  };
};
