/**
 * PURPOSE: Renders a compiled file's cached source in a read-only CodeMirror editor (line numbers +
 *   TS/TSX highlighting) that fills and scrolls within the EXPLORER_CODE panel, under a monospace
 *   file-path bar, with a gutter count beside each line showing how many generated test cases run
 *   through it, and the spans Assayer could not follow or cannot reach shaded and flagged. Reports the
 *   hovered line via onLineHover so the detail panel can highlight the related cases. Renders a centered
 *   placeholder prompt when no file is selected. The editor is memoized on the file so hovering never
 *   re-creates it.
 *
 *   The counts, the dark spots and the undriven spans all come from the file's ANALYSIS, so opening a
 *   file is enough to see them and none waits on a run. A region marked only after a Run would leave
 *   the reader staring at code Assayer cannot cover, rendered exactly like code it covers. The run
 *   carries a verbatim copy of both admissions, which says nothing the analysis does not already say
 *   and says it only after a click.
 *
 *   The gutter counts only the cases of entries a run executes: access not `unreachable`, and at least
 *   one case. Counting a case nothing runs would show coverage for a test that cannot run.
 *
 *   A span covering the WHOLE file is not shaded, and that is a rule about the treatment rather than
 *   about any one scope. Shading means "this region differs from the rest of the file"; a span with no
 *   rest to differ from carries none of that meaning, and a wall of colour behind every line only
 *   makes a genuinely local admission beside it harder to see. What the file is unable to drive is
 *   still stated in full — the detail panel names it, and naming is the job a span this wide can do.
 *   The gate is the SPAN's extent, never a scope's name: keying on a name would be detection by
 *   convention, and the day a private helper's body fills its file, the rule still reads correctly.
 *
 * USAGE:
 * <CodeViewerWidget fileView={fileView} onLineHover={setHoveredLine} />
 * // Renders the file's source with per-line test counts, shaded dark spots and undriven spans, and emits the hovered line
 */
import { useMemo } from '#gateway/npm/react';
import type { ReactElement } from '#gateway/npm/react';
import { Box, Center, Text } from '#gateway/npm/mantine__core';
import type { CompiledFileView } from '@assayer/shared/contracts';

import { SourceEditorLayerWidget } from './source-editor-layer-widget';
import { caseGutterMarkersTransformer } from '../../transformers/case-gutter-markers/case-gutter-markers-transformer';
import { darkSpotLineTransformer } from '../../transformers/dark-spot-line/dark-spot-line-transformer';
import { runnableFunctionsTransformer } from '../../transformers/runnable-functions/runnable-functions-transformer';
import { undrivenLineTransformer } from '../../transformers/undriven-line/undriven-line-transformer';

export interface CodeViewerWidgetProps {
  fileView: CompiledFileView | null;
  hoveredLine?: number | null;
  onLineHover?: (line: number | null) => void;
}

export const CodeViewerWidget = ({ fileView, hoveredLine, onLineHover }: CodeViewerWidgetProps): ReactElement => {
  const value = useMemo(
    () => (fileView === null ? '' : fileView.displayLines.map((line) => line.text).join('\n')),
    [fileView],
  );

  const markers = useMemo(() => {
    const gutterMarkers = caseGutterMarkersTransformer({
      // The detail panel narrows through this same transformer, so the two panes cannot disagree.
      functions: runnableFunctionsTransformer({ functions: fileView?.analysis?.functions ?? [] }),
    });
    // Adapter inputs allow raw primitives; map the branded markers to the adapter's raw shape.
    return gutterMarkers.map((marker) => ({ line: marker.line, count: marker.count }));
  }, [fileView]);

  const darkSpots = useMemo(
    () =>
      // Adapter inputs allow raw primitives; map the branded dark spots to the adapter's raw shape.
      (fileView?.analysis?.darkSpots ?? []).map((darkSpot) => ({
        startLine: Number(darkSpot.startLine),
        endLine: Number(darkSpot.endLine),
        label: darkSpotLineTransformer({ darkSpot }),
      })),
    [fileView],
  );

  const undriven = useMemo(
    () =>
      (fileView?.analysis?.undriven ?? [])
        // A span reaching from the first line to the last marks every line there is, so it draws no
        // distinction and only crowds the marks that do. The test is the extent, not who owns it.
        .filter(
          (entry) =>
            !(Number(entry.startLine) === 1 && Number(entry.endLine) >= (fileView?.displayLines.length ?? 0)),
        )
        // Adapter inputs allow raw primitives; map the branded entries to the adapter's raw shape.
        .map((entry) => ({
          startLine: Number(entry.startLine),
          endLine: Number(entry.endLine),
          label: undrivenLineTransformer({ entry }),
        })),
    [fileView],
  );

  const editor = useMemo(
    () =>
      SourceEditorLayerWidget({
        value,
        height: '100%',
        markers,
        darkSpots,
        undriven,
        ...(hoveredLine === undefined ? {} : { hoveredLine }),
        ...(onLineHover === undefined ? {} : { onLineHover }),
      }),
    [value, markers, darkSpots, undriven, hoveredLine, onLineHover],
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
