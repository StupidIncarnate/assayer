import { packageJsonReadBrokerProxy } from '../../../brokers/package-json/read/package-json-read-broker.proxy';

export const VersionShowResponderProxy = (): {
  packageJsonHasVersion: (params: { version: string }) => void;
} => {
  const packageJsonProxy = packageJsonReadBrokerProxy();

  return {
    packageJsonHasVersion: ({ version }: { version: string }): void => {
      packageJsonProxy.packageJsonHasVersion({ version });
    },
  };
};
