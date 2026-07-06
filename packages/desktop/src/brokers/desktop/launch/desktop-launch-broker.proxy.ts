import { electronBinaryPathAdapterProxy } from '../../../adapters/electron/binary-path/electron-binary-path-adapter.proxy';
import { electronMainEntryPathAdapterProxy } from '../../../adapters/electron/main-entry-path/electron-main-entry-path-adapter.proxy';
import { nodeChildProcessSpawnAdapterProxy } from '../../../adapters/node-child-process/spawn/node-child-process-spawn-adapter.proxy';

export const desktopLaunchBrokerProxy = (): Record<PropertyKey, never> => {
  electronBinaryPathAdapterProxy();
  electronMainEntryPathAdapterProxy();
  nodeChildProcessSpawnAdapterProxy();

  return {};
};
