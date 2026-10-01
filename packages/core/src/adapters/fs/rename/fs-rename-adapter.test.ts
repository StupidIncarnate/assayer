import { fsRenameAdapter } from './fs-rename-adapter';
import { fsRenameAdapterProxy } from './fs-rename-adapter.proxy';

describe('fsRenameAdapter', () => {
  describe('successful rename', () => {
    it('VALID: {from: "/repo/.tmp/x", to: "/repo/blob/x"} => renames the file to the destination and returns { success: true }', async () => {
      const proxy = fsRenameAdapterProxy();

      proxy.succeeds();

      const result = await fsRenameAdapter({ from: '/repo/.tmp/x', to: '/repo/blob/x' });

      expect(result).toBeUndefined();
      expect(proxy.getRenameArgs({ from: '/repo/.tmp/x' })).toStrictEqual([
        '/repo/.tmp/x',
        '/repo/blob/x',
      ]);
    });
  });
});
