import { processStdoutIsTtyAdapter } from './process-stdout-is-tty-adapter';
import { processStdoutIsTtyAdapterProxy } from './process-stdout-is-tty-adapter.proxy';

describe('processStdoutIsTtyAdapter', () => {
  describe('tty stdout', () => {
    it('VALID: {tty} => returns true', () => {
      const proxy = processStdoutIsTtyAdapterProxy();
      proxy.enableTty();

      expect(processStdoutIsTtyAdapter()).toBe(true);
    });
  });

  describe('non-tty stdout', () => {
    it('VALID: {not tty} => returns false', () => {
      const proxy = processStdoutIsTtyAdapterProxy();
      proxy.disableTty();

      expect(processStdoutIsTtyAdapter()).toBe(false);
    });
  });
});
