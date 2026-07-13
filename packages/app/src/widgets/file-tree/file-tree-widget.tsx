/**
 * PURPOSE: Renders a compiled file tree — recursively, fully expanded — and reports file clicks
 *   via the onFileClick callback prop. Highlights the currently selected file via selectedRelPath.
 *   Pure prop-driven; no bindings or brokers. Directories are not clickable for file selection.
 *
 * USAGE:
 * <FileTreeWidget tree={tree} selectedRelPath={relPath} onFileClick={({ relPath }) => {}} />
 * // Renders every node in tree.nodes, recursing into directories
 */
import type { ReactElement } from 'react';
import { Stack } from '@mantine/core';
import type { CompiledTree, RelPath } from '@assayer/shared/contracts';

import { FileTreeNodeLayerWidget } from './file-tree-node-layer-widget';

export interface FileTreeWidgetProps {
  tree: CompiledTree;
  onFileClick: (params: { relPath: RelPath }) => void;
  selectedRelPath?: RelPath | null;
}

export const FileTreeWidget = ({
  tree,
  onFileClick,
  selectedRelPath = null,
}: FileTreeWidgetProps): ReactElement => (
  <Stack gap={1} data-testid="FILE_TREE">
    {tree.nodes.map((node) => (
      <FileTreeNodeLayerWidget
        key={node.path}
        node={node}
        onFileClick={onFileClick}
        selectedRelPath={selectedRelPath}
      />
    ))}
  </Stack>
);
