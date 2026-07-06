import { testingLibraryRenderAdapter } from '../../adapters/testing-library/render/testing-library-render-adapter';
import { testingLibraryWaitForAdapter } from '../../adapters/testing-library/wait-for/testing-library-wait-for-adapter';
import { StatusPanelWidget } from './status-panel-widget';
import { StatusPanelWidgetProxy } from './status-panel-widget.proxy';
import { StatusViewStub } from '../../contracts/status-view/status-view.stub';

describe('StatusPanelWidget', () => {
  describe('with resolved status', () => {
    it('VALID: {status resolved} => renders the version, message and repo path', async () => {
      const proxy = StatusPanelWidgetProxy();
      proxy.setupStatus({
        status: StatusViewStub({ message: 'Assayer core online', repoPath: '/tmp/target' }),
      });

      const { getByTestId } = testingLibraryRenderAdapter({ ui: <StatusPanelWidget /> });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(getByTestId('STATUS_MESSAGE')).toHaveTextContent('Assayer core online');
        },
      });

      expect(getByTestId('STATUS_REPO')).toHaveTextContent('Repo: /tmp/target');
    });
  });
});
