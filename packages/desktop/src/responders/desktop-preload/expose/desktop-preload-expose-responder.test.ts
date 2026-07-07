import { DesktopPreloadExposeResponder } from './desktop-preload-expose-responder';
import { DesktopPreloadExposeResponderProxy } from './desktop-preload-expose-responder.proxy';

describe('DesktopPreloadExposeResponder', () => {
  describe('exposing the bridge', () => {
    it('VALID: {} => exposes the bridge and returns success', () => {
      DesktopPreloadExposeResponderProxy();

      const result = DesktopPreloadExposeResponder();

      expect(result).toStrictEqual({ success: true });
    });
  });
});
