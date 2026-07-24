import { analyzeFileBrokerProxy } from '../../analyze/file/analyze-file-broker.proxy';
import { cryptoSha256AdapterProxy } from '../../../adapters/crypto/sha256/crypto-sha256-adapter.proxy';
import { typescriptReadConfigAdapterProxy } from '../../../adapters/typescript/read-config/typescript-read-config-adapter.proxy';
import { resolveSiblingCalleeBrokerProxy } from '../../resolve-sibling/callee/resolve-sibling-callee-broker.proxy';

export const stubRealizeBrokerProxy = (): {
  setupTypeDefinition: ({ fileName, source }: { fileName: string; source: string }) => void;
} => {
  // The analyze, tsconfig read, and hash run REAL — the same real pipeline compose uses. Only the
  // sibling resolve is staged, because resolving a cross-file type against a real filesystem is exactly
  // what a unit test cannot do; the caller says where a specifier lands and what the definition's
  // source is instead.
  analyzeFileBrokerProxy();
  cryptoSha256AdapterProxy();
  typescriptReadConfigAdapterProxy();
  const sibling = resolveSiblingCalleeBrokerProxy();

  return {
    // A cross-file type's definition both RESOLVES to `fileName` and READS back `source` — the pair a
    // cross-file object read needs. Queued once so several type definitions wire in read order.
    setupTypeDefinition: ({ fileName, source }: { fileName: string; source: string }): void => {
      sibling.resolvesToSibling({ fileName, source });
    },
  };
};
