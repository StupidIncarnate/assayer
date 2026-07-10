import { cryptoSha256AdapterProxy } from '../../../adapters/crypto/sha256/crypto-sha256-adapter.proxy';

export const configHashBrokerProxy = (): Record<PropertyKey, never> => {
  cryptoSha256AdapterProxy();

  return {};
};
