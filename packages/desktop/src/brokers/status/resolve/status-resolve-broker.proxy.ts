import { statusGetBrokerProxy } from '@assayer/core/testing';

export const statusResolveBrokerProxy = (): Record<PropertyKey, never> => {
  statusGetBrokerProxy();

  return {};
};
