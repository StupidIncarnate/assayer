import { DesktopMainFlow } from './desktop-main-flow';

describe('DesktopMainFlow', () => {
  describe('export', () => {
    it('VALID: {} => exports the DesktopMainFlow function', () => {
      expect(DesktopMainFlow).toStrictEqual(expect.any(Function));
    });
  });
});
