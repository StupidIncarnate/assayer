import { assayerDesktopLaunchAdapter } from './assayer-desktop-launch-adapter';
import { assayerDesktopLaunchAdapterProxy } from './assayer-desktop-launch-adapter.proxy';

describe('assayerDesktopLaunchAdapter', () => {
  describe('launching the desktop', () => {
    it('VALID: {repoPath} => launches and returns success', () => {
      assayerDesktopLaunchAdapterProxy();

      const result = assayerDesktopLaunchAdapter({ repoPath: '/tmp/target' });

      expect(result).toStrictEqual({ success: true });
    });
  });
});
