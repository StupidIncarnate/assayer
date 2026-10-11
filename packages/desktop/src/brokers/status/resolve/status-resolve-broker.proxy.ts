import { statusGetBrokerProxy } from '@assayer/core/brokers/status/get/status-get-broker.proxy';

export const statusResolveBrokerProxy = (): Record<string, never> => {
  statusGetBrokerProxy();

  return {};
};
