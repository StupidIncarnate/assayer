import { statusGetBrokerProxy } from '@assayer/core/testing';

export const StatusShowResponderProxy = (): Record<PropertyKey, never> => {
  statusGetBrokerProxy();

  return {};
};
