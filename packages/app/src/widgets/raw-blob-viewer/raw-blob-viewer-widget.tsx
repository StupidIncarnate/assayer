/**
 * PURPOSE: Full-width raw view of a compiled file's cache blob — the exact CompiledFileView
 *   (relPath, contentHash, source lines, map nodes, derived analysis) pretty-printed as JSON, so you
 *   can inspect what the compiler actually wrote to .assayer/cache. Fills its pane and scrolls both
 *   axes; shows a centered prompt when no file is selected.
 *
 * USAGE:
 * <RawBlobViewerWidget fileView={fileView} />
 * // Renders the file's cache blob as formatted JSON (or a prompt when fileView is null)
 */
import type { ReactElement } from 'react';
import { Box, Center, Text } from '@mantine/core';
import type { CompiledFileView } from '@assayer/shared/contracts';

export interface RawBlobViewerWidgetProps {
  fileView: CompiledFileView | null;
}

export const RawBlobViewerWidget = ({ fileView }: RawBlobViewerWidgetProps): ReactElement => {
  return (
    <Box
      data-testid="RAW_BLOB_VIEW"
      bg="dark.8"
      p="sm"
      style={{ flex: 1, minHeight: 0, height: '100%', overflow: 'auto' }}
    >
      {fileView === null ? (
        <Center style={{ height: '100%' }}>
          <Text data-testid="RAW_EMPTY" c="dimmed" fz="sm">
            Select a file to inspect its cache blob
          </Text>
        </Center>
      ) : (
        <Text
          component="pre"
          data-testid="RAW_BLOB"
          ff="monospace"
          fz="xs"
          c="gray.3"
          style={{ margin: 0, whiteSpace: 'pre', minWidth: 'max-content' }}
        >
          {JSON.stringify(fileView, null, '  ')}
        </Text>
      )}
    </Box>
  );
};
