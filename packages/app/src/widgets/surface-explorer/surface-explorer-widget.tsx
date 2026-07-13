/**
 * PURPOSE: The compiled-surface explorer container — loads the compiled tree via the binding and
 *   lays out the Assayer explorer shell: a full-height, window-constrained frame with a top header
 *   bar and a two-pane body (a scrollable file tree on the left, the code viewer on the right). On
 *   a file click it fetches that file, tracks it as selected, and shows it in the code viewer.
 *   Shows a centered empty-surface prompt when nothing is compiled.
 *
 * USAGE:
 * <SurfaceExplorerWidget />
 * // Renders the explorer once the preload bridge resolves the compiled tree
 */
import { useCallback, useState } from 'react';
import type { ReactElement } from 'react';
import { Box, Center, Flex, Text } from '@mantine/core';
import { lineNumberContract } from '@assayer/shared/contracts';
import type { CompiledFileView, LineNumber, RelPath } from '@assayer/shared/contracts';

import { useCompiledTreeBinding } from '../../bindings/use-compiled-tree/use-compiled-tree-binding';
import { compiledFileFetchBroker } from '../../brokers/compiled-file/fetch/compiled-file-fetch-broker';
import { ExplorerHeaderWidget } from '../explorer-header/explorer-header-widget';
import { FileTreeWidget } from '../file-tree/file-tree-widget';
import { CodeViewerWidget } from '../code-viewer/code-viewer-widget';
import { DetailPanelWidget } from '../detail-panel/detail-panel-widget';

const SIDEBAR_WIDTH = 300;

export const SurfaceExplorerWidget = (): ReactElement => {
  const { data: tree } = useCompiledTreeBinding();
  const [fileView, setFileView] = useState<CompiledFileView | null>(null);
  const [selectedRelPath, setSelectedRelPath] = useState<RelPath | null>(null);
  const [hoveredLine, setHoveredLine] = useState<LineNumber | null>(null);

  const handleLineHover = useCallback((line: number | null): void => {
    setHoveredLine(line === null ? null : lineNumberContract.parse(line));
  }, []);

  return (
    <Box
      data-testid="SURFACE_EXPLORER"
      bg="dark.8"
      style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      {tree === null || tree.nodes.length === 0 ? (
        <Center style={{ flex: 1 }}>
          <Text data-testid="SURFACE_EMPTY" c="dimmed" fz="sm">
            No compiled surface — run assayer
          </Text>
        </Center>
      ) : (
        <>
          <Box
            component="header"
            bg="dark.7"
            px="md"
            py="xs"
            style={{ flexShrink: 0, borderBottom: '1px solid var(--mantine-color-dark-4)' }}
          >
            <ExplorerHeaderWidget summary={tree.summary} />
          </Box>
          <Flex style={{ flex: 1, minHeight: 0 }}>
            <Box
              bg="dark.7"
              p="xs"
              style={{
                width: SIDEBAR_WIDTH,
                flexShrink: 0,
                overflow: 'auto',
                borderRight: '1px solid var(--mantine-color-dark-4)',
              }}
            >
              <FileTreeWidget
                tree={tree}
                selectedRelPath={selectedRelPath}
                onFileClick={({ relPath }: { relPath: RelPath }): void => {
                  setSelectedRelPath(relPath);
                  setHoveredLine(null);
                  compiledFileFetchBroker({ relPath })
                    .then(setFileView)
                    .catch((error: unknown) => {
                      globalThis.console.error('[surface-explorer] failed to load file', error);
                    });
                }}
              />
            </Box>
            <Flex style={{ flex: 1, minHeight: 0 }}>
              <Flex bg="dark.8" style={{ flex: 1, minHeight: 0, flexDirection: 'column' }}>
                <CodeViewerWidget fileView={fileView} onLineHover={handleLineHover} />
              </Flex>
              <DetailPanelWidget
                analysis={fileView === null ? undefined : fileView.analysis}
                hoveredLine={hoveredLine}
              />
            </Flex>
          </Flex>
        </>
      )}
    </Box>
  );
};
