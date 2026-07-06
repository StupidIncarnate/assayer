import { assayerCoreStatusAdapterProxy } from '../../../adapters/assayer-core/status/assayer-core-status-adapter.proxy';

export const StatusShowResponderProxy = (): Record<PropertyKey, never> => {
  assayerCoreStatusAdapterProxy();

  return {};
};
