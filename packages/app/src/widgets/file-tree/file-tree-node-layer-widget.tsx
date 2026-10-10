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
import { memo, useMemo, useState } from '#gateway/npm/react';
import type { ReactElement } from '#gateway/npm/react';
import type { TreeNode } from '@assayer/shared/contracts';

import { treeFileCountTransformer } from '../../transformers/tree-file-count/tree-file-count-transformer';
import { errorCategoryStatics } from '../../statics/error-category/error-category-statics';

const FILE_BUTTON_BASE_STYLE = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  textAlign: 'left' as const,
  border: 'none',
  padding: '1px 6px',
  borderRadius: 'var(--mantine-radius-sm)',
  fontSize: 'var(--mantine-font-size-sm)',
  cursor: 'pointer',
  fontFamily: 'inherit',
  lineHeight: 'var(--mantine-line-height-sm)',
  overflow: 'hidden',
  whiteSpace: 'nowrap' as const,
};

const DIR_ROW_STYLE = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '1px 6px',
  cursor: 'pointer',
  userSelect: 'none' as const,
};

const DIR_CHEVRON_STYLE = {
  color: 'var(--mantine-color-dimmed)',
  fontSize: 9,
  width: 9,
  lineHeight: 1,
};

const DIR_LABEL_STYLE = {
  fontWeight: 600,
  fontSize: 'var(--mantine-font-size-xs)',
  color: 'var(--mantine-color-dimmed)',
};

const DIR_COUNT_STYLE = {
  fontWeight: 400,
  fontSize: 'var(--mantine-font-size-xs)',
  color: 'var(--mantine-color-dimmed)',
  opacity: 0.7,
};

const DIR_CHILDREN_STYLE = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 1,
  paddingLeft: 'var(--mantine-spacing-sm)',
  marginLeft: 9,
  borderLeft: '1px solid var(--mantine-color-dark-4)',
};

export interface FileTreeNodeLayerWidgetProps {
  node: TreeNode;
  onFileClick: (params: { relPath: string }) => void;
  selectedRelPath?: string | null;
}

export const FileTreeNodeLayerWidget = memo(
  ({
    node,
    onFileClick,
    selectedRelPath = null,
  }: FileTreeNodeLayerWidgetProps): ReactElement => {
    const [expanded, setExpanded] = useState(true);
    const fileCount = useMemo(
      () => (node.kind === 'dir' ? treeFileCountTransformer({ node }) : 0),
      [node],
    );

    if (node.kind === 'file') {
      const isSelected = node.path === selectedRelPath;
      const {errorCount} = (node as TreeNode & { errorCount?: number });

      return (
        <button
          type="button"
          data-testid="FILE_TREE_FILE"
          data-relpath={node.path}
          onClick={() => {
            onFileClick({ relPath: node.path });
          }}
          style={{
            ...FILE_BUTTON_BASE_STYLE,
            backgroundColor: isSelected ? 'var(--mantine-color-blue-light)' : 'transparent',
            color: isSelected ? 'var(--mantine-color-blue-light-color)' : 'inherit',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.name}</span>
          {errorCount !== undefined && errorCount > 0 ? (
            <span
              data-testid="FILE_TREE_FILE_ERROR_COUNT"
              style={{
                color: errorCategoryStatics.styleVar,
                fontWeight: 600,
                fontSize: 'var(--mantine-font-size-xs)',
                marginLeft: 6,
                flexShrink: 0,
              }}
            >
              {`! ${errorCount}`}
            </span>
          ) : null}
        </button>
      );
    }

    const children = node.children ?? [];

    return (
      <>
        <div
          role="button"
          tabIndex={0}
          style={DIR_ROW_STYLE}
          onClick={() => {
            setExpanded((current) => !current);
          }}
        >
          <span aria-hidden style={DIR_CHEVRON_STYLE}>
            {expanded ? '▾' : '▸'}
          </span>
          <span data-testid="FILE_TREE_DIR" style={DIR_LABEL_STYLE}>
            {node.name}
          </span>
          <span data-testid="FILE_TREE_DIR_COUNT" style={DIR_COUNT_STYLE}>
            ({fileCount.toLocaleString('en-US')})
          </span>
        </div>
        {expanded ? (
          <div style={DIR_CHILDREN_STYLE}>
            {children.map((child) => (
              <FileTreeNodeLayerWidget
                key={child.path}
                node={child}
                onFileClick={onFileClick}
                selectedRelPath={selectedRelPath}
              />
            ))}
          </div>
        ) : null}
      </>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.node !== nextProps.node || prevProps.onFileClick !== nextProps.onFileClick) {
      return false;
    }
    if (prevProps.node.kind === 'file') {
      const wasSelected = prevProps.node.path === prevProps.selectedRelPath;
      const isSelected = nextProps.node.path === nextProps.selectedRelPath;
      return wasSelected === isSelected;
    }

    const prevSelected = prevProps.selectedRelPath ?? '';
    const nextSelected = nextProps.selectedRelPath ?? '';
    const dirPrefix = `${prevProps.node.path}/`;
    const hadSelectedChild = prevSelected.startsWith(dirPrefix);
    const hasSelectedChild = nextSelected.startsWith(dirPrefix);

    return !hadSelectedChild && !hasSelectedChild;
  },
);
