import { packageJsonReadBrokerProxy } from '../../../brokers/package-json/read/package-json-read-broker.proxy';

export const VersionShowResponderProxy = (): Record<PropertyKey, never> => {
  packageJsonReadBrokerProxy();

  return {};
};
