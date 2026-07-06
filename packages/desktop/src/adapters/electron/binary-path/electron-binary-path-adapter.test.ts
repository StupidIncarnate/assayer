import { electronBinaryPathAdapter } from './electron-binary-path-adapter';
import { electronBinaryPathAdapterProxy } from './electron-binary-path-adapter.proxy';

describe('electronBinaryPathAdapter', () => {
  describe('resolving the binary path', () => {
    it('VALID: {} => returns the electron binary path', () => {
      electronBinaryPathAdapterProxy();

      const result = electronBinaryPathAdapter();

      expect(result).toBe('/usr/bin/electron');
    });
  });
});
