import { typescriptReadConfigAdapterProxy } from '../../../adapters/typescript/read-config/typescript-read-config-adapter.proxy';
import { resolveSiblingCalleeBrokerProxy } from '../../resolve-sibling/callee/resolve-sibling-callee-broker.proxy';

export const composeCrossFileMapBrokerProxy = (): {
  setupSibling: ({ fileName, source }: { fileName: string; source: string }) => void;
} => {
  // The tsconfig read runs REAL, and the reaches + funnel transformers are pure — only the sibling
  // resolve is staged, since resolving an imported callee against a real filesystem is exactly what a
  // unit test cannot do. The caller says where the specifier lands and what the sibling's source is.
  typescriptReadConfigAdapterProxy();
  const sibling = resolveSiblingCalleeBrokerProxy();

  return {
    setupSibling: ({ fileName, source }: { fileName: string; source: string }): void => {
      sibling.resolvesToSibling({ fileName, source });
    },
  };
};
