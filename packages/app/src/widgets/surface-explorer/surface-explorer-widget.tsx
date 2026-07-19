/**
 * PURPOSE: The compiled-surface explorer container — loads the compiled tree via the binding and
 *   lays out the Assayer explorer shell: a full-height, window-constrained frame with a top header
 *   bar and a two-pane body (a scrollable file tree on the left, the code viewer on the right). On
 *   a file click it fetches that file, tracks it as selected, and shows it in the code viewer.
 *
 *   Before a tree can be shown there are three ways not to have one, and each gets its own surface.
 *   They arrive here identically — no tree — and ask the reader for opposite things: WAIT, fix the
 *   named fault, or run assayer. One prompt for all three tells the reader with a corrupt cache to run
 *   a command that cannot help, and it stays on screen forever no matter how often they run it.
 *
 *   A failed fetch prints the Error's message VERBATIM and adds nothing to it. The resolver already
 *   named the fault and where it is — that message is the product surface, and it reaches here intact
 *   only because every desktop IPC handler answers with its failure as data rather than throwing it.
 *   A heading above it would bury the sentence the reader is meant to act on.
 *
 *   This is not the detail panel's run error and must never be confused with it: that panel owns the
 *   single copy of why a RUN failed, on a screen that has a tree. This is the TREE FETCH failing, when
 *   the explorer is the only thing on screen and no panel exists yet to tell.
 *
 * USAGE:
 * <SurfaceExplorerWidget />
 * // Renders the explorer once the preload bridge resolves the compiled tree
 */
import { useCallback, useState } from 'react';
import type { ReactElement } from 'react';
import { Box, Center, Flex, Tabs, Text } from '@mantine/core';
import { lineNumberContract } from '@assayer/shared/contracts';
import type { CompiledFileView, LineNumber, RelPath } from '@assayer/shared/contracts';

import { useCompiledTreeBinding } from '../../bindings/use-compiled-tree/use-compiled-tree-binding';
import { useFileRunBinding } from '../../bindings/use-file-run/use-file-run-binding';
import { compiledFileFetchBroker } from '../../brokers/compiled-file/fetch/compiled-file-fetch-broker';
import { ExplorerHeaderWidget } from '../explorer-header/explorer-header-widget';
import { FileTreeWidget } from '../file-tree/file-tree-widget';
import { CodeViewerWidget } from '../code-viewer/code-viewer-widget';
import { DetailPanelWidget } from '../detail-panel/detail-panel-widget';
import { RawBlobViewerWidget } from '../raw-blob-viewer/raw-blob-viewer-widget';
import { RunConsoleWidget } from '../run-console/run-console-widget';
import { surfaceExplorerStatics } from '../../statics/surface-explorer/surface-explorer-statics';

const SIDEBAR_WIDTH = 300;

export const SurfaceExplorerWidget = (): ReactElement => {
  // `treeError`, not `error`: this widget is within reach of three unrelated failures — the tree
  // fetch, a file load, and a run — and only the first one belongs to it.
  const { data: tree, loading, error: treeError } = useCompiledTreeBinding();
  const [fileView, setFileView] = useState<CompiledFileView | null>(null);
  const [selectedRelPath, setSelectedRelPath] = useState<RelPath | null>(null);
  const [hoveredLine, setHoveredLine] = useState<LineNumber | null>(null);
  // The console is opened by the Run action alone — never by mounting, and never by opening a file,
  // which does not run anything and so has no output to show.
  const [consoleOpen, setConsoleOpen] = useState(false);
  // Keyed on the selected path, so opening a file LOADS its last run and never starts one.
  const fileRun = useFileRunBinding({ relPath: selectedRelPath });

  const handleLineHover = useCallback((line: number | null): void => {
    setHoveredLine(line === null ? null : lineNumberContract.parse(line));
  }, []);

  const handleRun = useCallback((): void => {
    setConsoleOpen(true);
    fileRun.execute();
  }, [fileRun]);

  const handleConsoleHide = useCallback((): void => {
    setConsoleOpen(false);
  }, []);

  return (
    <Box
      data-testid="SURFACE_EXPLORER"
      bg="dark.8"
      style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      {/* A failure is settled BEFORE `loading` is read: the binding fetches once and never retries, so
          an error is the final word on this tree — and the binding lowers `loading` one microtask after
          it raises the error, so reading loading first would flash "Reading…" over a failure on its way
          to being told. These same guards are what narrow `treeError` and `tree` for the branches
          below, so the state the reader sees cannot drift from the state the code proved. */}
      {treeError === null ? (
        loading ? (
          <Center style={{ flex: 1 }}>
            <Text data-testid="SURFACE_LOADING" c="dimmed" fz="sm">
              {surfaceExplorerStatics.loadingMessage}
            </Text>
          </Center>
        ) : tree === null || tree.nodes.length === 0 ? (
          <Center style={{ flex: 1 }}>
            <Text data-testid="SURFACE_EMPTY" c="dimmed" fz="sm">
              {surfaceExplorerStatics.emptyMessage}
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
              <Tabs
                defaultValue="code"
                keepMounted={false}
                data-testid="FILE_VIEW_TABS"
                // minWidth:0 or this pane refuses to shrink below its content (flex items default to
                // min-width:auto), pushing the fixed-width panels to its right off the window edge —
                // where the root's overflow:hidden silently swallows them.
                style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}
              >
                <Tabs.List bg="dark.7">
                  <Tabs.Tab value="code" data-testid="VIEW_TAB_CODE">
                    Code
                  </Tabs.Tab>
                  <Tabs.Tab value="raw" data-testid="VIEW_TAB_RAW">
                    Raw JSON
                  </Tabs.Tab>
                </Tabs.List>
                <Tabs.Panel value="code" style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
                  <Flex style={{ height: '100%', minWidth: 0, minHeight: 0 }}>
                    <Flex bg="dark.8" style={{ flex: 1, minWidth: 0, minHeight: 0, flexDirection: 'column' }}>
                      <CodeViewerWidget fileView={fileView} onLineHover={handleLineHover} />
                    </Flex>
                    <DetailPanelWidget
                      analysis={fileView === null ? undefined : fileView.analysis}
                      resolvedEdges={fileView === null ? undefined : fileView.resolvedEdges}
                      relPath={selectedRelPath}
                      hoveredLine={hoveredLine}
                      run={fileRun.run}
                      running={fileRun.running}
                      runError={fileRun.error}
                      onRun={handleRun}
                    />
                  </Flex>
                </Tabs.Panel>
                <Tabs.Panel value="raw" style={{ flex: 1, minHeight: 0 }}>
                  <RawBlobViewerWidget fileView={fileView} />
                </Tabs.Panel>
              </Tabs>
              {/* Additive: its own full-height column at the far RIGHT of the body, so opening it
                  narrows the code pane rather than replacing any panel — the tree, code and detail
                  all stay mounted and readable. */}
              {consoleOpen ? (
                <RunConsoleWidget
                  output={fileRun.output}
                  running={fileRun.running}
                  // Whether it failed, never why: the reason goes to the detail panel alone, which is
                  // the one surface on screen for every failure the binding can raise.
                  failed={fileRun.error !== null}
                  onHide={handleConsoleHide}
                />
              ) : null}
            </Flex>
          </>
        )
      ) : (
        // Verbatim, and alone on the surface. The resolver named the fault and where it is; a heading
        // over it would bury the one sentence written to be acted on, and a paraphrase would replace
        // it with a worse one.
        <Center style={{ flex: 1 }} p="xl">
          <Text data-testid="SURFACE_ERROR" c="red.4" fz="xs" ff="monospace" style={{ whiteSpace: 'pre-wrap' }}>
            {treeError.message}
          </Text>
        </Center>
      )}
    </Box>
  );
};
