import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { useCompiledTreeBindingProxy } from '../../bindings/use-compiled-tree/use-compiled-tree-binding.proxy';
import { useFileRunBindingProxy } from '../../bindings/use-file-run/use-file-run-binding.proxy';
import { compiledFileFetchBrokerProxy } from '../../brokers/compiled-file/fetch/compiled-file-fetch-broker.proxy';
import { ExplorerHeaderWidgetProxy } from '../explorer-header/explorer-header-widget.proxy';
import { FileTreeWidgetProxy } from '../file-tree/file-tree-widget.proxy';
import { CodeViewerWidgetProxy } from '../code-viewer/code-viewer-widget.proxy';
import { DetailPanelWidgetProxy } from '../detail-panel/detail-panel-widget.proxy';
import { RawBlobViewerWidgetProxy } from '../raw-blob-viewer/raw-blob-viewer-widget.proxy';
import type { CompiledTreeStub, CompiledFileViewStub } from '@assayer/shared/contracts';

export const SurfaceExplorerWidgetProxy = (): {
  setupTree: (params: { tree: ReturnType<typeof CompiledTreeStub> }) => void;
  setupFile: (params: { relPath: string; fileView: ReturnType<typeof CompiledFileViewStub> }) => void;
  failFile: () => void;
  clickFile: (params: { label: string }) => Promise<void>;
  errorLogged: () => boolean;
} => {
  const treeProxy = useCompiledTreeBindingProxy();
  const fileProxy = compiledFileFetchBrokerProxy();
  // Defaults to "never run", so opening a file in these tests reads a saved run rather than
  // executing one.
  const runProxy = useFileRunBindingProxy();
  runProxy.neverRun();
  ExplorerHeaderWidgetProxy();
  FileTreeWidgetProxy();
  CodeViewerWidgetProxy();
  DetailPanelWidgetProxy();
  RawBlobViewerWidgetProxy();
  // Suppress + observe the surface-explorer's own console.error fallback so a failed file load
  // stays silent in the test output while still being assertable.
  const consoleErrorSpy = registerSpyOn({ object: globalThis.console, method: 'error' });
  consoleErrorSpy.mockImplementation(() => undefined);

  return {
    setupTree: ({ tree }: { tree: ReturnType<typeof CompiledTreeStub> }): void => {
      treeProxy.setupTree({ tree });
    },
    setupFile: ({ relPath, fileView }: { relPath: string; fileView: ReturnType<typeof CompiledFileViewStub> }): void => {
      fileProxy.setupFile({ relPath, fileView });
    },
    failFile: (): void => {
      fileProxy.fails();
    },
    clickFile: async ({ label }: { label: string }): Promise<void> => {
      await userEvent.click(screen.getByText(label));
    },
    errorLogged: (): boolean => consoleErrorSpy.mock.calls.length > 0,
  };
};
