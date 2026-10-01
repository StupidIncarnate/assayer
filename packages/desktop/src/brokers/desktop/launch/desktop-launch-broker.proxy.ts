import { desktopResolveBinaryBrokerProxy } from '../resolve-binary/desktop-resolve-binary-broker.proxy';
import { nodeChildProcessSpawnAdapterProxy } from '../../../adapters/node-child-process/spawn/node-child-process-spawn-adapter.proxy';
import { join } from '#gateway/node/path';

export const desktopLaunchBrokerProxy = (): {
  launchSpawns: (params: { repoPath: string }) => void;
} => {
  desktopResolveBinaryBrokerProxy();
  const spawnProxy = nodeChildProcessSpawnAdapterProxy();

  return {
    // The resolve-binary proxy fixes the electron binary path; the main entry is the compiled
    // desktop-main.js four levels above this folder's brokers/desktop/launch location.
    launchSpawns: ({ repoPath }: { repoPath: string }): void => {
      spawnProxy.spawns({
        command: '/usr/bin/electron',
        args: [join(__dirname, '..', '..', '..', '..', 'bin', 'desktop-main.js'), '--repo', repoPath],
      });
    },
  };
};
