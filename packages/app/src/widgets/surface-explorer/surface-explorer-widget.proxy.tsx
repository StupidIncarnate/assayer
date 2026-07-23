import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { useCompiledTreeBindingProxy } from '../../bindings/use-compiled-tree/use-compiled-tree-binding.proxy';
import { useFileRunBindingProxy } from '../../bindings/use-file-run/use-file-run-binding.proxy';
import { useAssayerStatusBindingProxy } from '../../bindings/use-assayer-status/use-assayer-status-binding.proxy';
import { compiledFileFetchBrokerProxy } from '../../brokers/compiled-file/fetch/compiled-file-fetch-broker.proxy';
import { ExplorerHeaderWidgetProxy } from '../explorer-header/explorer-header-widget.proxy';
import { FileTreeWidgetProxy } from '../file-tree/file-tree-widget.proxy';
import { CodeViewerWidgetProxy } from '../code-viewer/code-viewer-widget.proxy';
import { DetailPanelWidgetProxy } from '../detail-panel/detail-panel-widget.proxy';
import { RawBlobViewerWidgetProxy } from '../raw-blob-viewer/raw-blob-viewer-widget.proxy';
import { RunConsoleWidgetProxy } from '../run-console/run-console-widget.proxy';
import type { CompiledTreeStub, CompiledFileViewStub } from '@assayer/shared/contracts';

export const SurfaceExplorerWidgetProxy = (): {
  setupTree: (params: { tree: ReturnType<typeof CompiledTreeStub> }) => void;
  failTree: (params: { message: string }) => void;
  setupFile: (params: { relPath: string; fileView: ReturnType<typeof CompiledFileViewStub> }) => void;
  failFile: () => void;
  failRun: (params: { message: string }) => void;
  clickFile: (params: { label: string }) => Promise<void>;
  clickRun: () => Promise<void>;
  hideRunConsole: () => Promise<void>;
  emitRunOutput: (params: { chunk: string }) => void;
  errorLogged: () => boolean;
} => {
  const treeProxy = useCompiledTreeBindingProxy();
  const fileProxy = compiledFileFetchBrokerProxy();
  // Defaults to "never run", so opening a file in these tests reads a saved run rather than
  // executing one.
  const runProxy = useFileRunBindingProxy();
  runProxy.neverRun();
  // The status binding drives the detail panel's display-only runMode. Bare-created so it resolves the
  // default (thorough) status — every case renders live, exactly as these tree/code/run tests expect.
  useAssayerStatusBindingProxy();
  ExplorerHeaderWidgetProxy();
  FileTreeWidgetProxy();
  CodeViewerWidgetProxy();
  DetailPanelWidgetProxy();
  RawBlobViewerWidgetProxy();
  RunConsoleWidgetProxy();
  // Suppress + observe the surface-explorer's own console.error fallback so a failed file load
  // stays silent in the test output while still being assertable.
  const consoleErrorSpy = registerSpyOn({ object: globalThis.console, method: 'error' });
  consoleErrorSpy.mockImplementation(() => undefined);

  return {
    setupTree: ({ tree }: { tree: ReturnType<typeof CompiledTreeStub> }): void => {
      treeProxy.setupTree({ tree });
    },
    // Takes the message a real resolver would raise, so the test can assert the widget prints THAT
    // sentence rather than one the widget composed.
    failTree: ({ message }: { message: string }): void => {
      treeProxy.rejects({ error: new Error(message) });
    },
    setupFile: ({ relPath, fileView }: { relPath: string; fileView: ReturnType<typeof CompiledFileViewStub> }): void => {
      fileProxy.setupFile({ relPath, fileView });
    },
    failFile: (): void => {
      fileProxy.fails();
    },
    failRun: ({ message }: { message: string }): void => {
      runProxy.runFails({ message });
    },
    clickFile: async ({ label }: { label: string }): Promise<void> => {
      await userEvent.click(screen.getByText(label));
    },
    clickRun: async (): Promise<void> => {
      await userEvent.click(screen.getByTestId('RUN_BUTTON'));
    },
    hideRunConsole: async (): Promise<void> => {
      await userEvent.click(screen.getByTestId('RUN_CONSOLE_HIDE'));
    },
    emitRunOutput: ({ chunk }: { chunk: string }): void => {
      runProxy.emitRunOutput({ chunk });
    },
    errorLogged: (): boolean => consoleErrorSpy.mock.calls.length > 0,
  };
};
