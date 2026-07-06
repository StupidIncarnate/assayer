import { testingLibraryRenderAdapter } from '../../adapters/testing-library/render/testing-library-render-adapter';
import { AppRouterWidget } from './app-router-widget';
import { AppRouterWidgetProxy } from './app-router-widget.proxy';
import { StatusViewStub } from '../../contracts/status-view/status-view.stub';

describe('AppRouterWidget', () => {
  describe('routing to the status page', () => {
    it('VALID: {status resolved} => renders the status panel at the index route', async () => {
      const proxy = AppRouterWidgetProxy();
      proxy.setupStatus({ status: StatusViewStub() });

      const { findByTestId } = testingLibraryRenderAdapter({ ui: <AppRouterWidget /> });
      const panel = await findByTestId('STATUS_PANEL');

      expect(panel).toBeInTheDocument();
    });
  });
});
