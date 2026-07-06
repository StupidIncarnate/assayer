import { statusGetBrokerProxy } from '@assayer/core/testing';

export const assayerCoreStatusAdapterProxy = (): Record<PropertyKey, never> => {
  statusGetBrokerProxy();

  return {};
};
