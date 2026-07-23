import { reactCreateElementAdapter } from '../../../adapters/react/create-element/react-create-element-adapter';
import { testingLibraryRenderAdapter } from '../../../adapters/testing-library/render/testing-library-render-adapter';
import { StubsPageResponder } from './stubs-page-responder';
import { StubsPageResponderProxy } from './stubs-page-responder.proxy';
import { StubViewStub } from '@assayer/shared/contracts';

describe('StubsPageResponder', () => {
  describe('rendering the stubs page', () => {
    it('VALID: {stub view resolved} => renders the stub repository', async () => {
      const proxy = StubsPageResponderProxy();
      proxy.setupView({ view: StubViewStub() });

      const { findByTestId } = testingLibraryRenderAdapter({
        ui: reactCreateElementAdapter({ component: StubsPageResponder }),
      });
      const panel = await findByTestId('STUB_REPOSITORY');

      expect(panel).toBeInTheDocument();
    });
  });
});
