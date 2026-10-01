import { MantineProvider } from '#gateway/npm/mantine__core';
import { render } from '#gateway/npm/testing-library__react';
import { ExplorerHeaderWidget } from './explorer-header-widget';
import { ExplorerHeaderWidgetProxy } from './explorer-header-widget.proxy';
import { CompiledTreeStub } from '@assayer/shared/contracts/compiled-tree/compiled-tree.stub';

describe('ExplorerHeaderWidget', () => {
  describe('with a compiled-surface summary', () => {
    it('VALID: {summary: smoke-repo assayer/master ts 12 tsx 4} => renders the exact header text', () => {
      ExplorerHeaderWidgetProxy();
      const { summary } = CompiledTreeStub({
        summary: {
          repoName: 'assayer',
          branchName: 'master',
          rootFolderName: 'smoke-repo',
          tsCount: 12,
          tsxCount: 4,
        },
      });

      const { getByTestId } = render(<ExplorerHeaderWidget summary={summary} />, { wrapper: MantineProvider });

      expect(getByTestId('EXPLORER_HEADER').textContent).toBe(
        'Assayer | smoke-repo assayer/master | ts 12 tsx 4',
      );
    });
  });
});
