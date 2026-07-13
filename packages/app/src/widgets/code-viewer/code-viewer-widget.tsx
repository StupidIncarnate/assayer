/**
 * PURPOSE: Renders a compiled file's cached source in a read-only CodeMirror editor (line numbers +
 *   TS/TSX highlighting) that fills and scrolls within the EXPLORER_CODE panel, under a monospace
 *   file-path bar, with a gutter count beside each line showing how many generated test cases run
 *   through it. Reports the hovered line via onLineHover so the detail panel can highlight the
 *   related cases. Renders a centered placeholder prompt when no file is selected. The editor is
 *   memoized on the file so hovering never re-creates it.
 *
 * USAGE:
 * <CodeViewerWidget fileView={fileView} onLineHover={setHoveredLine} />
 * // Renders the file's source with per-line test counts and emits the hovered line
 */
import { useMemo } from 'react';
import type { ReactElement } from 'react';
import { Box, Center, Text } from '@mantine/core';
import type { CompiledFileView } from '@assayer/shared/contracts';

import { codemirrorViewAdapter } from '../../adapters/codemirror/view/codemirror-view-adapter';
import { caseGutterMarkersTransformer } from '../../transformers/case-gutter-markers/case-gutter-markers-transformer';

export interface CodeViewerWidgetProps {
  fileView: CompiledFileView | null;
  onLineHover?: (line: number | null) => void;
}

export const CodeViewerWidget = ({ fileView, onLineHover }: CodeViewerWidgetProps): ReactElement => {
  const value = useMemo(
    () => (fileView === null ? '' : fileView.displayLines.map((line) => line.text).join('\n')),
    [fileView],
  );

  const markers = useMemo(() => {
    const gutterMarkers = caseGutterMarkersTransformer({
      functions: fileView?.analysis?.functions ?? [],
    });
    // Adapter inputs allow raw primitives; map the branded markers to the adapter's raw shape.
    return gutterMarkers.map((marker) => ({ line: marker.line, count: marker.count }));
  }, [fileView]);

  const editor = useMemo(
    () =>
      codemirrorViewAdapter({
        value,
        height: '100%',
        markers,
        ...(onLineHover === undefined ? {} : { onLineHover }),
      }),
    [value, markers, onLineHover],
  );

  return (
    <Box
      data-testid="EXPLORER_CODE"
      style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      {fileView === null ? (
        <Center style={{ flex: 1 }}>
          <Text c="dimmed" fz="sm">
            Select a file to view its compiled source
          </Text>
        </Center>
      ) : (
        <>
          <Text
            ff="monospace"
            fz="xs"
            c="dimmed"
            px="sm"
            py={6}
            style={{ flexShrink: 0, borderBottom: '1px solid var(--mantine-color-dark-4)' }}
          >
            {fileView.relPath}
          </Text>
          <Box style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>{editor}</Box>
        </>
      )}
    </Box>
  );
};
