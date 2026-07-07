import { AppFlow } from './app-flow';

describe('AppFlow', () => {
  describe('export', () => {
    it('VALID: {} => exports the AppFlow function', () => {
      expect(AppFlow).toStrictEqual(expect.any(Function));
    });
  });
});
