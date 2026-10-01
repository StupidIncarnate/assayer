import { desktopResolveBinaryBroker } from './desktop-resolve-binary-broker';
import { desktopResolveBinaryBrokerProxy } from './desktop-resolve-binary-broker.proxy';

describe('electronBinaryPathAdapter', () => {
  describe('resolving the binary path', () => {
    it('VALID: {} => returns the electron binary path', () => {
      desktopResolveBinaryBrokerProxy();

      const result = desktopResolveBinaryBroker();

      expect(result).toBe('/usr/bin/electron');
    });
  });
});
