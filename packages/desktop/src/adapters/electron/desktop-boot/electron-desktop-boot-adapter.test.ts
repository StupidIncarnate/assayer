import { CompiledTreeStub, CompiledFileViewStub } from '@assayer/shared/contracts';

import { electronDesktopBootAdapter } from './electron-desktop-boot-adapter';
import { electronDesktopBootAdapterProxy } from './electron-desktop-boot-adapter.proxy';
import { DesktopStatusStub } from '../../../contracts/desktop-status/desktop-status.stub';

describe('electronDesktopBootAdapter', () => {
  describe('booting the main process', () => {
    it('VALID: {all three channels + resolvers} => boots the window, returns success, and registers all three IPC handlers', async () => {
      const proxy = electronDesktopBootAdapterProxy();

      const result = await electronDesktopBootAdapter({
        statusChannel: 'assayer:status',
        compiledTreeChannel: 'assayer:compiled-tree',
        compiledFileChannel: 'assayer:compiled-file',
        resolveStatus: () => DesktopStatusStub(),
        resolveCompiledTree: async () => Promise.resolve(CompiledTreeStub()),
        resolveCompiledFile: async () => Promise.resolve(CompiledFileViewStub()),
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.handledChannels()).toStrictEqual([
        'assayer:status',
        'assayer:compiled-tree',
        'assayer:compiled-file',
      ]);
    });

    it('VALID: {invokeHandler on compiledFileChannel with relPath} => passes relPath through to resolveCompiledFile', async () => {
      const proxy = electronDesktopBootAdapterProxy();
      const compiledFileView = CompiledFileViewStub();

      await electronDesktopBootAdapter({
        statusChannel: 'assayer:status',
        compiledTreeChannel: 'assayer:compiled-tree',
        compiledFileChannel: 'assayer:compiled-file',
        resolveStatus: () => DesktopStatusStub(),
        resolveCompiledTree: async () => Promise.resolve(CompiledTreeStub()),
        resolveCompiledFile: async ({ relPath }) => {
          expect(relPath).toBe('src/foo.ts');

          return Promise.resolve(compiledFileView);
        },
      });

      const result = await proxy.invokeHandler({ channel: 'assayer:compiled-file', arg: 'src/foo.ts' });

      expect(result).toStrictEqual(compiledFileView);
    });
  });
});
