import { AppMountFlow } from './app-mount-flow';

describe('AppMountFlow', () => {
  describe('export', () => {
    it('VALID: {} => exports the AppMountFlow function', () => {
      expect(AppMountFlow).toStrictEqual(expect.any(Function));
    });
  });
});
