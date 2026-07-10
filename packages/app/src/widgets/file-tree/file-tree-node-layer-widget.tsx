/**
 * PURPOSE: Renders a single compiled-tree node (file or directory) and recurses into its
 *   children — the self-recursive layer FileTreeWidget uses to render a tree fully expanded.
 *   Files report clicks via onFileClick; directories are never clickable for file selection.
 *
 * USAGE:
 * <FileTreeNodeLayerWidget node={node} onFileClick={({ relPath }) => {}} />
 * // Renders the node's name; for a directory, recurses into node.children (always expanded)
 */
import type { ReactElement } from 'react';
import { Stack, Text } from '@mantine/core';
import type { RelPath, TreeNode } from '@assayer/shared/contracts';

export interface FileTreeNodeLayerWidgetProps {
  node: TreeNode;
  onFileClick: (params: { relPath: RelPath }) => void;
}

export const FileTreeNodeLayerWidget = ({
  node,
  onFileClick,
}: FileTreeNodeLayerWidgetProps): ReactElement => {
  if (node.kind === 'file') {
    return (
      <Text data-testid="FILE_TREE_FILE" onClick={() => { onFileClick({ relPath: node.path }); }}>
        {node.name}
      </Text>
    );
  }

  const children = node.children ?? [];

  return (
    <>
      <Text data-testid="FILE_TREE_DIR">{node.name}</Text>
      <Stack gap={0} pl="md">
        {children.map((child) => (
          <FileTreeNodeLayerWidget key={child.path} node={child} onFileClick={onFileClick} />
        ))}
      </Stack>
    </>
  );
};
