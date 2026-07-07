import { StartDesktopMain } from './start-desktop-main';

describe('StartDesktopMain', () => {
  describe('export', () => {
    it('VALID: {} => exports the StartDesktopMain function', () => {
      expect(StartDesktopMain).toStrictEqual(expect.any(Function));
    });
  });
});
