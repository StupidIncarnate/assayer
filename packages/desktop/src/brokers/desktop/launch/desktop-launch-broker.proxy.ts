import { desktopResolveBinaryBrokerProxy } from '../resolve-binary/desktop-resolve-binary-broker.proxy';
import { nodeChildProcessSpawnAdapterProxy } from '../../../adapters/node-child-process/spawn/node-child-process-spawn-adapter.proxy';

export const desktopLaunchBrokerProxy = (): Record<PropertyKey, never> => {
  desktopResolveBinaryBrokerProxy();
  nodeChildProcessSpawnAdapterProxy();

  return {};
};
