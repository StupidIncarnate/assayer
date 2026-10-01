import { desktopResolveBinaryBroker } from './desktop-resolve-binary-broker';
import { desktopResolveBinaryBrokerProxy } from './desktop-resolve-binary-broker.proxy';

describe('desktopResolveBinaryBroker', () => {
  describe('resolving the binary path', () => {
    it('VALID: {electron default export is a path} => returns the electron binary path', () => {
      const proxy = desktopResolveBinaryBrokerProxy();
      proxy.setupBinaryPath({ path: '/usr/bin/electron' });

      const result = desktopResolveBinaryBroker();

      expect(result).toBe('/usr/bin/electron');
    });
  });

  describe('running inside the Electron runtime', () => {
    it('ERROR: {electron default export is the API object} => throws that the binary path is unavailable', () => {
      const proxy = desktopResolveBinaryBrokerProxy();
      proxy.setupInsideElectron();

      expect(() => desktopResolveBinaryBroker()).toThrow(
        /^Electron binary path unavailable — not running in a Node launcher context$/u,
      );
    });
  });
});
