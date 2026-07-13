/**
 * PURPOSE: Renders a single compiled-tree node (file or directory) and recurses into its
 *   children — the self-recursive layer FileTreeWidget uses to render the tree. Files render as
 *   dense interactive rows (hover + selected highlight) that report clicks via onFileClick;
 *   directories render as a clickable header row (chevron + name) that expands/collapses their
 *   children, expanded by default. Directory clicks never call onFileClick.
 *
 * USAGE:
 * <FileTreeNodeLayerWidget node={node} selectedRelPath={relPath} onFileClick={({ relPath }) => {}} />
 * // Renders the node's name; a directory toggles its children open/closed on click
 */
import { useState } from 'react';
import type { ReactElement } from 'react';
import { Group, NavLink, Stack, Text } from '@mantine/core';
import type { RelPath, TreeNode } from '@assayer/shared/contracts';

export interface FileTreeNodeLayerWidgetProps {
  node: TreeNode;
  onFileClick: (params: { relPath: RelPath }) => void;
  selectedRelPath?: RelPath | null;
}

export const FileTreeNodeLayerWidget = ({
  node,
  onFileClick,
  selectedRelPath = null,
}: FileTreeNodeLayerWidgetProps): ReactElement => {
  const [expanded, setExpanded] = useState(true);

  if (node.kind === 'file') {
    return (
      <NavLink
        data-testid="FILE_TREE_FILE"
        label={node.name}
        active={node.path === selectedRelPath}
        onClick={() => {
          onFileClick({ relPath: node.path });
        }}
        styles={{
          root: { padding: '1px 6px', borderRadius: 'var(--mantine-radius-sm)' },
          label: { fontSize: 'var(--mantine-font-size-sm)' },
        }}
      />
    );
  }

  const children = node.children ?? [];

  return (
    <>
      <Group
        gap={4}
        wrap="nowrap"
        px={6}
        py={1}
        style={{ cursor: 'pointer', userSelect: 'none' }}
        onClick={() => {
          setExpanded((current) => !current);
        }}
      >
        <Text aria-hidden c="dimmed" fz={9} w={9} style={{ lineHeight: 1 }}>
          {expanded ? '▾' : '▸'}
        </Text>
        <Text data-testid="FILE_TREE_DIR" fw={600} fz="xs" c="dimmed">
          {node.name}
        </Text>
      </Group>
      {expanded ? (
        <Stack
          gap={1}
          pl="sm"
          ml={9}
          style={{ borderLeft: '1px solid var(--mantine-color-dark-4)' }}
        >
          {children.map((child) => (
            <FileTreeNodeLayerWidget
              key={child.path}
              node={child}
              onFileClick={onFileClick}
              selectedRelPath={selectedRelPath}
            />
          ))}
        </Stack>
      ) : null}
    </>
  );
};
