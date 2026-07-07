import { docsGetBrokerProxy } from '@assayer/core/testing';

export const DocsShowResponderProxy = (): Record<PropertyKey, never> => {
  docsGetBrokerProxy();

  return {};
};
