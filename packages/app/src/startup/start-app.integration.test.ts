import { StartApp } from './start-app';

describe('StartApp', () => {
  describe('export', () => {
    it('VALID: {} => exports the StartApp function', () => {
      expect(StartApp).toStrictEqual(expect.any(Function));
    });
  });
});
