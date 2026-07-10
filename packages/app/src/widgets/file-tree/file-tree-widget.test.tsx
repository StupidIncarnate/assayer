import { testingLibraryRenderAdapter } from '../../adapters/testing-library/render/testing-library-render-adapter';
import { FileTreeWidget } from './file-tree-widget';
import { FileTreeWidgetProxy } from './file-tree-widget.proxy';
import { CompiledTreeStub } from '@assayer/shared/contracts';

describe('FileTreeWidget', () => {
  describe('rendering a compiled tree', () => {
    it('VALID: {tree rendered} => renders the FILE_TREE container', () => {
      const tree = CompiledTreeStub({
        nodes: [
          {
            name: 'packages',
            path: 'packages',
            kind: 'dir',
            children: [
              { name: 'shared', path: 'packages/shared', kind: 'dir', children: [] },
              {
                name: 'web',
                path: 'packages/web',
                kind: 'dir',
                children: [{ name: 'app.tsx', path: 'packages/web/app.tsx', kind: 'file' }],
              },
              { name: 'server', path: 'packages/server', kind: 'dir', children: [] },
              { name: 'cli', path: 'packages/cli', kind: 'dir', children: [] },
            ],
          },
        ],
      });
      const onFileClick = jest.fn();
      FileTreeWidgetProxy();

      const { getByTestId } = testingLibraryRenderAdapter({
        ui: <FileTreeWidget tree={tree} onFileClick={onFileClick} />,
      });

      expect(getByTestId('FILE_TREE')).toBeInTheDocument();
    });

    const NODE_LABELS = ['packages', 'shared', 'web', 'server', 'cli', 'app.tsx'] as const;

    it.each(NODE_LABELS)('VALID: {tree rendered} => renders node label %s', (label) => {
      const tree = CompiledTreeStub({
        nodes: [
          {
            name: 'packages',
            path: 'packages',
            kind: 'dir',
            children: [
              { name: 'shared', path: 'packages/shared', kind: 'dir', children: [] },
              {
                name: 'web',
                path: 'packages/web',
                kind: 'dir',
                children: [{ name: 'app.tsx', path: 'packages/web/app.tsx', kind: 'file' }],
              },
              { name: 'server', path: 'packages/server', kind: 'dir', children: [] },
              { name: 'cli', path: 'packages/cli', kind: 'dir', children: [] },
            ],
          },
        ],
      });
      const onFileClick = jest.fn();
      FileTreeWidgetProxy();

      const { getByText } = testingLibraryRenderAdapter({
        ui: <FileTreeWidget tree={tree} onFileClick={onFileClick} />,
      });

      expect(getByText(label)).toBeInTheDocument();
    });
  });

  describe('file click behavior', () => {
    it('VALID: {click the file app.tsx} => calls onFileClick with its relPath', async () => {
      const tree = CompiledTreeStub({
        nodes: [
          {
            name: 'packages',
            path: 'packages',
            kind: 'dir',
            children: [
              { name: 'shared', path: 'packages/shared', kind: 'dir', children: [] },
              {
                name: 'web',
                path: 'packages/web',
                kind: 'dir',
                children: [{ name: 'app.tsx', path: 'packages/web/app.tsx', kind: 'file' }],
              },
              { name: 'server', path: 'packages/server', kind: 'dir', children: [] },
              { name: 'cli', path: 'packages/cli', kind: 'dir', children: [] },
            ],
          },
        ],
      });
      const onFileClick = jest.fn();
      const proxy = FileTreeWidgetProxy();
      testingLibraryRenderAdapter({
        ui: <FileTreeWidget tree={tree} onFileClick={onFileClick} />,
      });

      await proxy.clickEntry({ label: 'app.tsx' });

      expect(onFileClick.mock.calls).toStrictEqual([[{ relPath: 'packages/web/app.tsx' }]]);
    });

    it('VALID: {click the directory web} => does not call onFileClick', async () => {
      const tree = CompiledTreeStub({
        nodes: [
          {
            name: 'packages',
            path: 'packages',
            kind: 'dir',
            children: [
              { name: 'shared', path: 'packages/shared', kind: 'dir', children: [] },
              {
                name: 'web',
                path: 'packages/web',
                kind: 'dir',
                children: [{ name: 'app.tsx', path: 'packages/web/app.tsx', kind: 'file' }],
              },
              { name: 'server', path: 'packages/server', kind: 'dir', children: [] },
              { name: 'cli', path: 'packages/cli', kind: 'dir', children: [] },
            ],
          },
        ],
      });
      const onFileClick = jest.fn();
      const proxy = FileTreeWidgetProxy();
      testingLibraryRenderAdapter({
        ui: <FileTreeWidget tree={tree} onFileClick={onFileClick} />,
      });

      await proxy.clickEntry({ label: 'web' });

      expect(onFileClick.mock.calls).toStrictEqual([]);
    });
  });
});
