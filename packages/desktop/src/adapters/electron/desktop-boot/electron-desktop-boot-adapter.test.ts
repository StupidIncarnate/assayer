import { CompiledTreeStub, CompiledFileViewStub, RunResultStub } from '@assayer/shared/contracts';

import { electronDesktopBootAdapter } from './electron-desktop-boot-adapter';
import { electronDesktopBootAdapterProxy } from './electron-desktop-boot-adapter.proxy';
import { DesktopStatusStub } from '../../../contracts/desktop-status/desktop-status.stub';

describe('electronDesktopBootAdapter', () => {
  describe('booting the main process', () => {
    it('VALID: {every channel + resolver} => boots the window, returns success, and registers every IPC handler', async () => {
      const proxy = electronDesktopBootAdapterProxy();

      const result = await electronDesktopBootAdapter({
        statusChannel: 'assayer:status',
        compiledTreeChannel: 'assayer:compiled-tree',
        compiledFileChannel: 'assayer:compiled-file',
        runChannel: 'assayer:run',
        savedRunChannel: 'assayer:saved-run',
        resolveStatus: () => DesktopStatusStub(),
        resolveCompiledTree: async () => Promise.resolve(CompiledTreeStub()),
        resolveCompiledFile: async () => Promise.resolve(CompiledFileViewStub()),
        resolveRun: async () => Promise.resolve(RunResultStub()),
        resolveSavedRun: async () => Promise.resolve(RunResultStub()),
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.handledChannels()).toStrictEqual([
        'assayer:status',
        'assayer:compiled-tree',
        'assayer:compiled-file',
        'assayer:run',
        'assayer:saved-run',
      ]);
    });

    it('VALID: {invokeHandler on compiledFileChannel with relPath} => passes relPath through to resolveCompiledFile', async () => {
      const proxy = electronDesktopBootAdapterProxy();
      const compiledFileView = CompiledFileViewStub();

      await electronDesktopBootAdapter({
        statusChannel: 'assayer:status',
        compiledTreeChannel: 'assayer:compiled-tree',
        compiledFileChannel: 'assayer:compiled-file',
        runChannel: 'assayer:run',
        savedRunChannel: 'assayer:saved-run',
        resolveStatus: () => DesktopStatusStub(),
        resolveCompiledTree: async () => Promise.resolve(CompiledTreeStub()),
        resolveCompiledFile: async ({ relPath }) => {
          expect(relPath).toBe('src/foo.ts');

          return Promise.resolve(compiledFileView);
        },
        resolveRun: async () => Promise.resolve(RunResultStub()),
        resolveSavedRun: async () => Promise.resolve(RunResultStub()),
      });

      const result = await proxy.invokeHandler({ channel: 'assayer:compiled-file', arg: 'src/foo.ts' });

      expect(result).toStrictEqual(compiledFileView);
    });

    it('VALID: {invokeHandler on runChannel with relPath} => passes relPath through to resolveRun', async () => {
      const proxy = electronDesktopBootAdapterProxy();
      const run = RunResultStub();

      await electronDesktopBootAdapter({
        statusChannel: 'assayer:status',
        compiledTreeChannel: 'assayer:compiled-tree',
        compiledFileChannel: 'assayer:compiled-file',
        runChannel: 'assayer:run',
        savedRunChannel: 'assayer:saved-run',
        resolveStatus: () => DesktopStatusStub(),
        resolveCompiledTree: async () => Promise.resolve(CompiledTreeStub()),
        resolveCompiledFile: async () => Promise.resolve(CompiledFileViewStub()),
        resolveRun: async ({ relPath }) => {
          expect(relPath).toBe('src/boolean/and.ts');

          return Promise.resolve(run);
        },
        resolveSavedRun: async () => Promise.resolve(RunResultStub()),
      });

      const result = await proxy.invokeHandler({ channel: 'assayer:run', arg: 'src/boolean/and.ts' });

      expect(result).toStrictEqual(run);
    });

    // Its own channel, never a lazy accessor on run: asking what a file's last run said must not
    // start a Jest run just because someone opened the file.
    it('VALID: {invokeHandler on savedRunChannel} => answers without running anything', async () => {
      const proxy = electronDesktopBootAdapterProxy();
      const run = RunResultStub();

      await electronDesktopBootAdapter({
        statusChannel: 'assayer:status',
        compiledTreeChannel: 'assayer:compiled-tree',
        compiledFileChannel: 'assayer:compiled-file',
        runChannel: 'assayer:run',
        savedRunChannel: 'assayer:saved-run',
        resolveStatus: () => DesktopStatusStub(),
        resolveCompiledTree: async () => Promise.resolve(CompiledTreeStub()),
        resolveCompiledFile: async () => Promise.resolve(CompiledFileViewStub()),
        resolveRun: async () => Promise.reject(new Error('savedRun must never execute a run')),
        resolveSavedRun: async () => Promise.resolve(run),
      });

      const result = await proxy.invokeHandler({ channel: 'assayer:saved-run', arg: 'src/boolean/and.ts' });

      expect(result).toStrictEqual(run);
    });
  });
});
