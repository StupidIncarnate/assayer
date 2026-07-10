import { testingLibraryRenderAdapter } from '../../adapters/testing-library/render/testing-library-render-adapter';
import { ExplorerHeaderWidget } from './explorer-header-widget';
import { ExplorerHeaderWidgetProxy } from './explorer-header-widget.proxy';
import { CompiledTreeStub } from '@assayer/shared/contracts';

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

      const { getByTestId } = testingLibraryRenderAdapter({
        ui: <ExplorerHeaderWidget summary={summary} />,
      });

      expect(getByTestId('EXPLORER_HEADER').textContent).toBe(
        'Assayer | smoke-repo assayer/master | ts 12 tsx 4',
      );
    });
  });
});
