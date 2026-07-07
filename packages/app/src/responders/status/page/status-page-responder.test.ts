import { reactCreateElementAdapter } from '../../../adapters/react/create-element/react-create-element-adapter';
import { testingLibraryRenderAdapter } from '../../../adapters/testing-library/render/testing-library-render-adapter';
import { StatusPageResponder } from './status-page-responder';
import { StatusPageResponderProxy } from './status-page-responder.proxy';
import { StatusViewStub } from '../../../contracts/status-view/status-view.stub';

describe('StatusPageResponder', () => {
  describe('rendering the status page', () => {
    it('VALID: {status resolved} => renders the status panel', async () => {
      const proxy = StatusPageResponderProxy();
      proxy.setupStatus({ status: StatusViewStub() });

      const { findByTestId } = testingLibraryRenderAdapter({
        ui: reactCreateElementAdapter({ component: StatusPageResponder }),
      });
      const panel = await findByTestId('STATUS_PANEL');

      expect(panel).toBeInTheDocument();
    });
  });
});
