/**
 * PURPOSE: The compiled-surface explorer container — loads the compiled tree via the binding,
 *   renders the header + file tree, and on a file click fetches that file and shows it in the code
 *   viewer. Shows an empty-surface prompt when nothing is compiled.
 *
 * USAGE:
 * <SurfaceExplorerWidget />
 * // Renders the explorer once the preload bridge resolves the compiled tree
 */
import { useState } from 'react';
import type { ReactElement } from 'react';
import { Stack, Text } from '@mantine/core';
import type { CompiledFileView, RelPath } from '@assayer/shared/contracts';

import { useCompiledTreeBinding } from '../../bindings/use-compiled-tree/use-compiled-tree-binding';
import { compiledFileFetchBroker } from '../../brokers/compiled-file/fetch/compiled-file-fetch-broker';
import { ExplorerHeaderWidget } from '../explorer-header/explorer-header-widget';
import { FileTreeWidget } from '../file-tree/file-tree-widget';
import { CodeViewerWidget } from '../code-viewer/code-viewer-widget';

export const SurfaceExplorerWidget = (): ReactElement => {
  const { data: tree } = useCompiledTreeBinding();
  const [fileView, setFileView] = useState<CompiledFileView | null>(null);

  return (
    <div data-testid="SURFACE_EXPLORER">
      {tree === null || tree.nodes.length === 0 ? (
        <Text data-testid="SURFACE_EMPTY">No compiled surface — run assayer</Text>
      ) : (
        <Stack gap="sm">
          <ExplorerHeaderWidget summary={tree.summary} />
          <FileTreeWidget
            tree={tree}
            onFileClick={({ relPath }: { relPath: RelPath }): void => {
              compiledFileFetchBroker({ relPath })
                .then(setFileView)
                .catch((error: unknown) => {
                  globalThis.console.error('[surface-explorer] failed to load file', error);
                });
            }}
          />
          <CodeViewerWidget fileView={fileView} />
        </Stack>
      )}
    </div>
  );
};
