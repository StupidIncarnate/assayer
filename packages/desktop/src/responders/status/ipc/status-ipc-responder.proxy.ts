import { assayerCoreStatusAdapterProxy } from '../../../adapters/assayer-core/status/assayer-core-status-adapter.proxy';

export const StatusIpcResponderProxy = (): Record<PropertyKey, never> => {
  assayerCoreStatusAdapterProxy();

  return {};
};
