import { setImmediate } from '#gateway/node/setImmediate';
import { desktopLaunchBroker } from './desktop-launch-broker';
import { desktopLaunchBrokerProxy } from './desktop-launch-broker.proxy';

describe('desktopLaunchBroker', () => {
  describe('launching the desktop app', () => {
    it('VALID: {repoPath} => spawns electron and writes nothing to stderr', async () => {
      const proxy = desktopLaunchBrokerProxy();
      proxy.launchSpawns({ repoPath: '/tmp/target' });

      desktopLaunchBroker({ repoPath: '/tmp/target' });
      await new Promise<void>((resolve) => {
        setImmediate(() => {
          resolve();
        });
      });

      expect(proxy.getStderrText()).toBe('');
    });
  });

  describe('a launch that fails to start', () => {
    it('ERROR: {electron is missing} => writes an actionable message to stderr instead of crashing', async () => {
      const proxy = desktopLaunchBrokerProxy();
      proxy.launchFailsToStart({ repoPath: '/tmp/target' });

      desktopLaunchBroker({ repoPath: '/tmp/target' });
      await new Promise<void>((resolve) => {
        setImmediate(() => {
          resolve();
        });
      });

      expect(proxy.getStderrText()).toBe(
        'assayer: failed to launch /usr/bin/electron (spawn /usr/bin/electron ENOENT). Verify the executable exists and is runnable, then try again.\n',
      );
    });
  });
});
