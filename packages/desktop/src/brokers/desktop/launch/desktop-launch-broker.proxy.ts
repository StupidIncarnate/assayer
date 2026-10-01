import { desktopResolveBinaryBrokerProxy } from '../resolve-binary/desktop-resolve-binary-broker.proxy';
import { electronMainEntryPathAdapterProxy } from '../../../adapters/electron/main-entry-path/electron-main-entry-path-adapter.proxy';
import { nodeChildProcessSpawnAdapterProxy } from '../../../adapters/node-child-process/spawn/node-child-process-spawn-adapter.proxy';

export const desktopLaunchBrokerProxy = (): Record<PropertyKey, never> => {
  desktopResolveBinaryBrokerProxy();
  electronMainEntryPathAdapterProxy();
  nodeChildProcessSpawnAdapterProxy();

  return {};
};
