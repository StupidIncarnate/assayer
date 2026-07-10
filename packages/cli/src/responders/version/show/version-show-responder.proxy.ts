import { packageJsonReadAdapterProxy } from '../../../adapters/package-json/read/package-json-read-adapter.proxy';

export const VersionShowResponderProxy = (): Record<PropertyKey, never> => {
  packageJsonReadAdapterProxy();

  return {};
};
