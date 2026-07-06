import { docsGetBrokerProxy } from '@assayer/core/testing';

export const assayerCoreDocsAdapterProxy = (): Record<PropertyKey, never> => {
  docsGetBrokerProxy();

  return {};
};
