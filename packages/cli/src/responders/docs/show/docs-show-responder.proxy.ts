import { assayerCoreDocsAdapterProxy } from '../../../adapters/assayer-core/docs/assayer-core-docs-adapter.proxy';

export const DocsShowResponderProxy = (): Record<PropertyKey, never> => {
  assayerCoreDocsAdapterProxy();

  return {};
};
