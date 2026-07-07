import { DesktopPreloadFlow } from './desktop-preload-flow';

describe('DesktopPreloadFlow', () => {
  describe('export', () => {
    it('VALID: {} => exports the DesktopPreloadFlow function', () => {
      expect(DesktopPreloadFlow).toStrictEqual(expect.any(Function));
    });
  });
});
