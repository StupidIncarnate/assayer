import { electronMainEntryPathAdapter } from './electron-main-entry-path-adapter';
import { electronMainEntryPathAdapterProxy } from './electron-main-entry-path-adapter.proxy';

describe('electronMainEntryPathAdapter', () => {
  describe('resolving the main entry path', () => {
    it('VALID: {} => returns a path ending in bin/desktop-main.js', () => {
      electronMainEntryPathAdapterProxy();

      const result = electronMainEntryPathAdapter();

      expect(result).toMatch(/^.+bin\/desktop-main\.js$/u);
    });
  });
});
