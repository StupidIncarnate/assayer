import { StartDesktopPreload } from './start-desktop-preload';

describe('StartDesktopPreload', () => {
  describe('export', () => {
    it('VALID: {} => exports the StartDesktopPreload function', () => {
      expect(StartDesktopPreload).toStrictEqual(expect.any(Function));
    });
  });
});
