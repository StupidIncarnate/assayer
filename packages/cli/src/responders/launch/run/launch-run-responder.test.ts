import { LaunchRunResponder } from './launch-run-responder';
import { LaunchRunResponderProxy } from './launch-run-responder.proxy';

describe('LaunchRunResponder', () => {
  describe('launching the desktop', () => {
    it('VALID: {repoPath} => launches and returns a confirmation message', () => {
      const proxy = LaunchRunResponderProxy();
      proxy.launchSpawns({ repoPath: '/tmp/target' });

      const result = LaunchRunResponder({ repoPath: '/tmp/target' });

      expect(result).toBe('Opening the Assayer desktop app for /tmp/target...');
    });
  });
});
