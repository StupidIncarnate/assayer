import { CompiledTreeStub, CompiledFileViewStub, RunConsoleStub, RunResultStub, StubViewStub } from '@assayer/shared/contracts';

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
        stubsChannel: 'assayer:stubs',
        runChannel: 'assayer:run',
        savedRunChannel: 'assayer:saved-run',
        savedConsoleChannel: 'assayer:saved-console',
        runOutputChannel: 'assayer:run-output',
        resolveStatus: () => DesktopStatusStub(),
        resolveCompiledTree: async () => Promise.resolve(CompiledTreeStub()),
        resolveStubs: async () => Promise.resolve(StubViewStub()),
        resolveCompiledFile: async () => Promise.resolve(CompiledFileViewStub()),
        resolveRun: async () => Promise.resolve(RunResultStub()),
        resolveSavedRun: async () => Promise.resolve(RunResultStub()),
        resolveSavedConsole: async () => Promise.resolve(RunConsoleStub()),
      });

      expect(result).toBeUndefined();
      expect(proxy.handledChannels()).toStrictEqual([
        'assayer:status',
        'assayer:compiled-tree',
        'assayer:compiled-file',
        'assayer:stubs',
        'assayer:run',
        'assayer:saved-run',
        'assayer:saved-console',
      ]);
    });

    it('VALID: {invokeHandler on compiledFileChannel with relPath} => passes relPath through to resolveCompiledFile', async () => {
      const proxy = electronDesktopBootAdapterProxy();
      const compiledFileView = CompiledFileViewStub();

      await electronDesktopBootAdapter({
        statusChannel: 'assayer:status',
        compiledTreeChannel: 'assayer:compiled-tree',
        compiledFileChannel: 'assayer:compiled-file',
        stubsChannel: 'assayer:stubs',
        runChannel: 'assayer:run',
        savedRunChannel: 'assayer:saved-run',
        savedConsoleChannel: 'assayer:saved-console',
        runOutputChannel: 'assayer:run-output',
        resolveStatus: () => DesktopStatusStub(),
        resolveCompiledTree: async () => Promise.resolve(CompiledTreeStub()),
        resolveStubs: async () => Promise.resolve(StubViewStub()),
        resolveCompiledFile: async ({ relPath }) => {
          expect(relPath).toBe('src/foo.ts');

          return Promise.resolve(compiledFileView);
        },
        resolveRun: async () => Promise.resolve(RunResultStub()),
        resolveSavedRun: async () => Promise.resolve(RunResultStub()),
        resolveSavedConsole: async () => Promise.resolve(RunConsoleStub()),
      });

      const result = await proxy.invokeHandler({ channel: 'assayer:compiled-file', arg: 'src/foo.ts' });

      expect(result).toStrictEqual({ success: true, valueRaw: compiledFileView });
    });

    it('VALID: {invokeHandler on runChannel with relPath} => passes relPath through to resolveRun', async () => {
      const proxy = electronDesktopBootAdapterProxy();
      const run = RunResultStub();

      await electronDesktopBootAdapter({
        statusChannel: 'assayer:status',
        compiledTreeChannel: 'assayer:compiled-tree',
        compiledFileChannel: 'assayer:compiled-file',
        stubsChannel: 'assayer:stubs',
        runChannel: 'assayer:run',
        savedRunChannel: 'assayer:saved-run',
        savedConsoleChannel: 'assayer:saved-console',
        runOutputChannel: 'assayer:run-output',
        resolveStatus: () => DesktopStatusStub(),
        resolveCompiledTree: async () => Promise.resolve(CompiledTreeStub()),
        resolveStubs: async () => Promise.resolve(StubViewStub()),
        resolveCompiledFile: async () => Promise.resolve(CompiledFileViewStub()),
        resolveRun: async ({ relPath }) => {
          expect(relPath).toBe('src/happy-path/boolean/and/and.ts');

          return Promise.resolve(run);
        },
        resolveSavedRun: async () => Promise.resolve(RunResultStub()),
        resolveSavedConsole: async () => Promise.resolve(RunConsoleStub()),
      });

      const result = await proxy.invokeHandler({ channel: 'assayer:run', arg: 'src/happy-path/boolean/and/and.ts' });

      expect(result).toStrictEqual({ success: true, valueRaw: run });
    });

    // The run answers ONCE but writes throughout, so its output reaches the window by being pushed
    // to the sender as it arrives. Handed back with the result instead, the report could only ever
    // appear after the wait it exists to narrate.
    it('VALID: {resolveRun writes output} => each chunk is sent to the sender on the run-output channel', async () => {
      const proxy = electronDesktopBootAdapterProxy();

      await electronDesktopBootAdapter({
        statusChannel: 'assayer:status',
        compiledTreeChannel: 'assayer:compiled-tree',
        compiledFileChannel: 'assayer:compiled-file',
        stubsChannel: 'assayer:stubs',
        runChannel: 'assayer:run',
        savedRunChannel: 'assayer:saved-run',
        savedConsoleChannel: 'assayer:saved-console',
        runOutputChannel: 'assayer:run-output',
        resolveStatus: () => DesktopStatusStub(),
        resolveCompiledTree: async () => Promise.resolve(CompiledTreeStub()),
        resolveStubs: async () => Promise.resolve(StubViewStub()),
        resolveCompiledFile: async () => Promise.resolve(CompiledFileViewStub()),
        resolveRun: async ({ onOutput }) => {
          onOutput({ chunk: 'Assayer is updating caches\n' });
          onOutput({ chunk: 'a.ts  3/3 passed\n' });

          return Promise.resolve(RunResultStub());
        },
        resolveSavedRun: async () => Promise.resolve(RunResultStub()),
        resolveSavedConsole: async () => Promise.resolve(RunConsoleStub()),
      });

      await proxy.invokeHandler({ channel: 'assayer:run', arg: 'src/happy-path/boolean/and/and.ts' });

      expect(proxy.sentToRenderer()).toStrictEqual([
        ['assayer:run-output', 'Assayer is updating caches\n'],
        ['assayer:run-output', 'a.ts  3/3 passed\n'],
      ]);
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
        stubsChannel: 'assayer:stubs',
        runChannel: 'assayer:run',
        savedRunChannel: 'assayer:saved-run',
        savedConsoleChannel: 'assayer:saved-console',
        runOutputChannel: 'assayer:run-output',
        resolveStatus: () => DesktopStatusStub(),
        resolveCompiledTree: async () => Promise.resolve(CompiledTreeStub()),
        resolveStubs: async () => Promise.resolve(StubViewStub()),
        resolveCompiledFile: async () => Promise.resolve(CompiledFileViewStub()),
        resolveRun: async () => Promise.reject(new Error('savedRun must never execute a run')),
        resolveSavedRun: async () => Promise.resolve(run),
        resolveSavedConsole: async () => Promise.resolve(RunConsoleStub()),
      });

      const result = await proxy.invokeHandler({ channel: 'assayer:saved-run', arg: 'src/happy-path/boolean/and/and.ts' });

      expect(result).toStrictEqual({ success: true, valueRaw: run });
    });

    // The report half of a past run, on its own channel and equally incapable of starting one. It is
    // what lets a reader see WHY a file failed without re-running it — including a run someone did in
    // a terminal, since the CLI saves the same bytes.
    it('VALID: {invokeHandler on savedConsoleChannel} => answers with the saved report, running nothing', async () => {
      const proxy = electronDesktopBootAdapterProxy();
      const report = RunConsoleStub({ value: 'src/a.ts  0/1 passed\n  ERROR mapEach("oops")\n' });

      await electronDesktopBootAdapter({
        statusChannel: 'assayer:status',
        compiledTreeChannel: 'assayer:compiled-tree',
        compiledFileChannel: 'assayer:compiled-file',
        stubsChannel: 'assayer:stubs',
        runChannel: 'assayer:run',
        savedRunChannel: 'assayer:saved-run',
        savedConsoleChannel: 'assayer:saved-console',
        runOutputChannel: 'assayer:run-output',
        resolveStatus: () => DesktopStatusStub(),
        resolveCompiledTree: async () => Promise.resolve(CompiledTreeStub()),
        resolveStubs: async () => Promise.resolve(StubViewStub()),
        resolveCompiledFile: async () => Promise.resolve(CompiledFileViewStub()),
        resolveRun: async () => Promise.reject(new Error('savedConsole must never execute a run')),
        resolveSavedRun: async () => Promise.resolve(RunResultStub()),
        resolveSavedConsole: async () => Promise.resolve(report),
      });

      const result = await proxy.invokeHandler({ channel: 'assayer:saved-console', arg: 'src/a.ts' });

      expect(result).toStrictEqual({ success: true, valueRaw: report });
    });

    // The stubs channel answers with the merged StubView the /stubs view renders. Like the tree, it
    // takes no argument — the resolver reads the whole namespace's stub repository.
    it('VALID: {invokeHandler on stubsChannel} => answers with the merged StubView', async () => {
      const proxy = electronDesktopBootAdapterProxy();
      const view = StubViewStub();

      await electronDesktopBootAdapter({
        statusChannel: 'assayer:status',
        compiledTreeChannel: 'assayer:compiled-tree',
        compiledFileChannel: 'assayer:compiled-file',
        stubsChannel: 'assayer:stubs',
        runChannel: 'assayer:run',
        savedRunChannel: 'assayer:saved-run',
        savedConsoleChannel: 'assayer:saved-console',
        runOutputChannel: 'assayer:run-output',
        resolveStatus: () => DesktopStatusStub(),
        resolveCompiledTree: async () => Promise.resolve(CompiledTreeStub()),
        resolveCompiledFile: async () => Promise.resolve(CompiledFileViewStub()),
        resolveStubs: async () => Promise.resolve(view),
        resolveRun: async () => Promise.resolve(RunResultStub()),
        resolveSavedRun: async () => Promise.resolve(RunResultStub()),
        resolveSavedConsole: async () => Promise.resolve(RunConsoleStub()),
      });

      const result = await proxy.invokeHandler({ channel: 'assayer:stubs' });

      expect(result).toStrictEqual({ success: true, valueRaw: view });
    });
  });

  // Electron's `ipcRenderer.invoke` builds `Error invoking remote method '<channel>': <error>` in the
  // renderer whenever a handler THROWS, and nothing configures that off. So a handler here must never
  // throw: it answers with the failure instead, and the message stays the product surface a broker
  // wrote rather than arriving dressed as a stack trace. These pin that for every channel — a handler
  // that starts throwing again resolves nothing and fails here first.
  describe('failing resolvers', () => {
    it('ERROR: {resolveRun rejects with a P1 error} => the run handler ANSWERS with the message, verbatim', async () => {
      const proxy = electronDesktopBootAdapterProxy();

      await electronDesktopBootAdapter({
        statusChannel: 'assayer:status',
        compiledTreeChannel: 'assayer:compiled-tree',
        compiledFileChannel: 'assayer:compiled-file',
        stubsChannel: 'assayer:stubs',
        runChannel: 'assayer:run',
        savedRunChannel: 'assayer:saved-run',
        savedConsoleChannel: 'assayer:saved-console',
        runOutputChannel: 'assayer:run-output',
        resolveStatus: () => DesktopStatusStub(),
        resolveCompiledTree: async () => Promise.resolve(CompiledTreeStub()),
        resolveStubs: async () => Promise.resolve(StubViewStub()),
        resolveCompiledFile: async () => Promise.resolve(CompiledFileViewStub()),
        resolveRun: async () =>
          Promise.reject(new Error('assayer: the run produced no result for src/happy-path/switch/pure-statement/pure-statement.ts.')),
        resolveSavedRun: async () => Promise.resolve(RunResultStub()),
        resolveSavedConsole: async () => Promise.resolve(RunConsoleStub()),
      });

      const result = await proxy.invokeHandler({ channel: 'assayer:run', arg: 'src/happy-path/switch/pure-statement/pure-statement.ts' });

      expect(result).toStrictEqual({
        success: false,
        message: 'assayer: the run produced no result for src/happy-path/switch/pure-statement/pure-statement.ts.',
      });
    });

    it('ERROR: {resolveStatus throws} => the status handler ANSWERS with the message, verbatim', async () => {
      const proxy = electronDesktopBootAdapterProxy();

      await electronDesktopBootAdapter({
        statusChannel: 'assayer:status',
        compiledTreeChannel: 'assayer:compiled-tree',
        compiledFileChannel: 'assayer:compiled-file',
        stubsChannel: 'assayer:stubs',
        runChannel: 'assayer:run',
        savedRunChannel: 'assayer:saved-run',
        savedConsoleChannel: 'assayer:saved-console',
        runOutputChannel: 'assayer:run-output',
        resolveStatus: () => {
          throw new Error('assayer: no config found at /repo. Run `assayer init` to create one.');
        },
        resolveCompiledTree: async () => Promise.resolve(CompiledTreeStub()),
        resolveStubs: async () => Promise.resolve(StubViewStub()),
        resolveCompiledFile: async () => Promise.resolve(CompiledFileViewStub()),
        resolveRun: async () => Promise.resolve(RunResultStub()),
        resolveSavedRun: async () => Promise.resolve(RunResultStub()),
        resolveSavedConsole: async () => Promise.resolve(RunConsoleStub()),
      });

      const result = await proxy.invokeHandler({ channel: 'assayer:status' });

      expect(result).toStrictEqual({
        success: false,
        message: 'assayer: no config found at /repo. Run `assayer init` to create one.',
      });
    });

    it('ERROR: {resolveStubs rejects with a P1 error} => the stubs handler ANSWERS with the message, verbatim', async () => {
      const proxy = electronDesktopBootAdapterProxy();

      await electronDesktopBootAdapter({
        statusChannel: 'assayer:status',
        compiledTreeChannel: 'assayer:compiled-tree',
        compiledFileChannel: 'assayer:compiled-file',
        stubsChannel: 'assayer:stubs',
        runChannel: 'assayer:run',
        savedRunChannel: 'assayer:saved-run',
        savedConsoleChannel: 'assayer:saved-console',
        runOutputChannel: 'assayer:run-output',
        resolveStatus: () => DesktopStatusStub(),
        resolveCompiledTree: async () => Promise.resolve(CompiledTreeStub()),
        resolveCompiledFile: async () => Promise.resolve(CompiledFileViewStub()),
        resolveStubs: async () =>
          Promise.reject(new Error('assayer: cannot read /repo/assayer.config.json. Run `assayer status` in that repo to generate one.')),
        resolveRun: async () => Promise.resolve(RunResultStub()),
        resolveSavedRun: async () => Promise.resolve(RunResultStub()),
        resolveSavedConsole: async () => Promise.resolve(RunConsoleStub()),
      });

      const result = await proxy.invokeHandler({ channel: 'assayer:stubs' });

      expect(result).toStrictEqual({
        success: false,
        message: 'assayer: cannot read /repo/assayer.config.json. Run `assayer status` in that repo to generate one.',
      });
    });

    it('ERROR: {resolveCompiledFile rejects} => the compiled-file handler ANSWERS with the message, verbatim', async () => {
      const proxy = electronDesktopBootAdapterProxy();

      await electronDesktopBootAdapter({
        statusChannel: 'assayer:status',
        compiledTreeChannel: 'assayer:compiled-tree',
        compiledFileChannel: 'assayer:compiled-file',
        stubsChannel: 'assayer:stubs',
        runChannel: 'assayer:run',
        savedRunChannel: 'assayer:saved-run',
        savedConsoleChannel: 'assayer:saved-console',
        runOutputChannel: 'assayer:run-output',
        resolveStatus: () => DesktopStatusStub(),
        resolveCompiledTree: async () => Promise.resolve(CompiledTreeStub()),
        resolveStubs: async () => Promise.resolve(StubViewStub()),
        resolveCompiledFile: async () => Promise.reject(new Error('assayer: src/foo.ts is not in the compiled cache.')),
        resolveRun: async () => Promise.resolve(RunResultStub()),
        resolveSavedRun: async () => Promise.resolve(RunResultStub()),
        resolveSavedConsole: async () => Promise.resolve(RunConsoleStub()),
      });

      const result = await proxy.invokeHandler({ channel: 'assayer:compiled-file', arg: 'src/foo.ts' });

      expect(result).toStrictEqual({
        success: false,
        message: 'assayer: src/foo.ts is not in the compiled cache.',
      });
    });
  });
});
