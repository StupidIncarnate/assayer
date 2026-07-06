import { desktopLaunchBroker } from './desktop-launch-broker';
import { desktopLaunchBrokerProxy } from './desktop-launch-broker.proxy';

describe('desktopLaunchBroker', () => {
  describe('launching the desktop app', () => {
    it('VALID: {repoPath} => spawns electron and returns success', () => {
      desktopLaunchBrokerProxy();

      const result = desktopLaunchBroker({ repoPath: '/tmp/target' });

      expect(result).toStrictEqual({ success: true });
    });
  });
});
