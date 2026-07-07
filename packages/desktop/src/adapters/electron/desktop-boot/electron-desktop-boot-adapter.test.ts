import { electronDesktopBootAdapter } from './electron-desktop-boot-adapter';
import { electronDesktopBootAdapterProxy } from './electron-desktop-boot-adapter.proxy';
import { DesktopStatusStub } from '../../../contracts/desktop-status/desktop-status.stub';

describe('electronDesktopBootAdapter', () => {
  describe('booting the main process', () => {
    it('VALID: {statusChannel, resolveStatus} => boots the window and returns success', async () => {
      electronDesktopBootAdapterProxy();

      const result = await electronDesktopBootAdapter({
        statusChannel: 'assayer:status',
        resolveStatus: () => DesktopStatusStub(),
      });

      expect(result).toStrictEqual({ success: true });
    });
  });
});
