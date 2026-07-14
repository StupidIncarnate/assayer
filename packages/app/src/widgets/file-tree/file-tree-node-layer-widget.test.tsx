import { testingLibraryRenderAdapter } from '../../adapters/testing-library/render/testing-library-render-adapter';
import { FileTreeNodeLayerWidget } from './file-tree-node-layer-widget';
import { FileTreeNodeLayerWidgetProxy } from './file-tree-node-layer-widget.proxy';
import { CompiledTreeStub } from '@assayer/shared/contracts';

describe('FileTreeNodeLayerWidget', () => {
  describe('file node', () => {
    it('VALID: {node: file} => renders the file name with the FILE_TREE_FILE testid', () => {
      const { nodes } = CompiledTreeStub({
        nodes: [{ name: 'app.tsx', path: 'app.tsx', kind: 'file' }],
      });
      const onFileClick = jest.fn();
      FileTreeNodeLayerWidgetProxy();

      const { getByTestId } = testingLibraryRenderAdapter({
        ui: (
          <>
            {nodes.map((node) => (
              <FileTreeNodeLayerWidget key={node.path} node={node} onFileClick={onFileClick} />
            ))}
          </>
        ),
      });

      expect(getByTestId('FILE_TREE_FILE')).toHaveTextContent('app.tsx');
      expect(getByTestId('FILE_TREE_FILE')).toHaveAttribute('data-relpath', 'app.tsx');
    });

    it('VALID: {click file node} => calls onFileClick with the node relPath', async () => {
      const { nodes } = CompiledTreeStub({
        nodes: [{ name: 'app.tsx', path: 'app.tsx', kind: 'file' }],
      });
      const onFileClick = jest.fn();
      const proxy = FileTreeNodeLayerWidgetProxy();
      testingLibraryRenderAdapter({
        ui: (
          <>
            {nodes.map((node) => (
              <FileTreeNodeLayerWidget key={node.path} node={node} onFileClick={onFileClick} />
            ))}
          </>
        ),
      });

      await proxy.clickEntry({ label: 'app.tsx' });

      expect(onFileClick.mock.calls).toStrictEqual([[{ relPath: 'app.tsx' }]]);
    });
  });

  describe('directory node with children', () => {
    it('VALID: {node: dir with a child file} => renders the dir name with FILE_TREE_DIR and recurses into children', () => {
      const { nodes } = CompiledTreeStub({
        nodes: [
          {
            name: 'src',
            path: 'src',
            kind: 'dir',
            children: [{ name: 'index.ts', path: 'src/index.ts', kind: 'file' }],
          },
        ],
      });
      const onFileClick = jest.fn();
      FileTreeNodeLayerWidgetProxy();

      const { getByTestId, getByText } = testingLibraryRenderAdapter({
        ui: (
          <>
            {nodes.map((node) => (
              <FileTreeNodeLayerWidget key={node.path} node={node} onFileClick={onFileClick} />
            ))}
          </>
        ),
      });

      expect(getByTestId('FILE_TREE_DIR')).toHaveTextContent('src');
      expect(getByText('index.ts')).toBeInTheDocument();
    });

    it('VALID: {click dir node} => does not call onFileClick', async () => {
      const { nodes } = CompiledTreeStub({
        nodes: [
          {
            name: 'src',
            path: 'src',
            kind: 'dir',
            children: [{ name: 'index.ts', path: 'src/index.ts', kind: 'file' }],
          },
        ],
      });
      const onFileClick = jest.fn();
      const proxy = FileTreeNodeLayerWidgetProxy();
      testingLibraryRenderAdapter({
        ui: (
          <>
            {nodes.map((node) => (
              <FileTreeNodeLayerWidget key={node.path} node={node} onFileClick={onFileClick} />
            ))}
          </>
        ),
      });

      await proxy.clickEntry({ label: 'src' });

      expect(onFileClick.mock.calls).toStrictEqual([]);
    });

    it('VALID: {click dir node twice} => collapses then re-expands its children', async () => {
      const { nodes } = CompiledTreeStub({
        nodes: [
          {
            name: 'src',
            path: 'src',
            kind: 'dir',
            children: [{ name: 'index.ts', path: 'src/index.ts', kind: 'file' }],
          },
        ],
      });
      const onFileClick = jest.fn();
      const proxy = FileTreeNodeLayerWidgetProxy();
      const { getByText, queryAllByTestId } = testingLibraryRenderAdapter({
        ui: (
          <>
            {nodes.map((node) => (
              <FileTreeNodeLayerWidget key={node.path} node={node} onFileClick={onFileClick} />
            ))}
          </>
        ),
      });

      expect(getByText('index.ts')).toBeInTheDocument();

      await proxy.clickEntry({ label: 'src' });

      expect(queryAllByTestId('FILE_TREE_FILE')).toStrictEqual([]);

      await proxy.clickEntry({ label: 'src' });

      expect(getByText('index.ts')).toBeInTheDocument();
    });
  });

  describe('directory node with no children', () => {
    it('EMPTY: {node: dir with children: []} => renders the dir name and no file entries', () => {
      const { nodes } = CompiledTreeStub({
        nodes: [{ name: 'empty-dir', path: 'empty-dir', kind: 'dir', children: [] }],
      });
      const onFileClick = jest.fn();
      FileTreeNodeLayerWidgetProxy();

      const { getByTestId, queryAllByTestId } = testingLibraryRenderAdapter({
        ui: (
          <>
            {nodes.map((node) => (
              <FileTreeNodeLayerWidget key={node.path} node={node} onFileClick={onFileClick} />
            ))}
          </>
        ),
      });

      expect(getByTestId('FILE_TREE_DIR')).toHaveTextContent('empty-dir');
      expect(queryAllByTestId('FILE_TREE_FILE')).toStrictEqual([]);
    });

    it('EMPTY: {node: dir with no children field} => renders the dir name and no file entries', () => {
      const { nodes } = CompiledTreeStub({
        nodes: [{ name: 'bare-dir', path: 'bare-dir', kind: 'dir' }],
      });
      const onFileClick = jest.fn();
      FileTreeNodeLayerWidgetProxy();

      const { getByTestId, queryAllByTestId } = testingLibraryRenderAdapter({
        ui: (
          <>
            {nodes.map((node) => (
              <FileTreeNodeLayerWidget key={node.path} node={node} onFileClick={onFileClick} />
            ))}
          </>
        ),
      });

      expect(getByTestId('FILE_TREE_DIR')).toHaveTextContent('bare-dir');
      expect(queryAllByTestId('FILE_TREE_FILE')).toStrictEqual([]);
    });
  });
});
