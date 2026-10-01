import { desktopResolveBinaryBrokerProxy } from '../resolve-binary/desktop-resolve-binary-broker.proxy';
import { spawnFireAndForgetProxy } from '#gateway/node/child_process/spawn-fire-and-forget/spawn-fire-and-forget.proxy';
import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { join } from '#gateway/node/path';

export const desktopLaunchBrokerProxy = (): {
  launchSpawns: (params: { repoPath: string }) => void;
  launchFailsToStart: (params: { repoPath: string }) => void;
  getStderrText: () => string;
} => {
  desktopResolveBinaryBrokerProxy();
  const spawnProxy = spawnFireAndForgetProxy();
  const stderrGateway = stderrProxy();

  return {
    // The resolve-binary proxy fixes the electron binary path; the main entry is the compiled
    // desktop-main.js four levels above this folder's brokers/desktop/launch location.
    launchSpawns: ({ repoPath }: { repoPath: string }): void => {
      spawnProxy.setupLaunch({
        command: '/usr/bin/electron',
        args: [join(__dirname, '..', '..', '..', '..', 'bin', 'desktop-main.js'), '--repo', repoPath],
      });
    },
    launchFailsToStart: ({ repoPath }: { repoPath: string }): void => {
      spawnProxy.setupNotFound({
        command: '/usr/bin/electron',
        args: [join(__dirname, '..', '..', '..', '..', 'bin', 'desktop-main.js'), '--repo', repoPath],
      });
    },
    getStderrText: (): string => stderrGateway.getWrittenText(),
  };
};
