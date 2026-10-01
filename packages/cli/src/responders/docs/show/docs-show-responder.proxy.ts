import { docsGetBrokerProxy } from '@assayer/core/brokers/docs/get/docs-get-broker.proxy';

export const DocsShowResponderProxy = (): Record<PropertyKey, never> => {
  docsGetBrokerProxy();

  return {};
};
