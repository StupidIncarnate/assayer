import { statusGetBrokerProxy } from '@assayer/core/brokers/status/get/status-get-broker.proxy';

export const StatusShowResponderProxy = (): Record<PropertyKey, never> => {
  statusGetBrokerProxy();

  return {};
};
