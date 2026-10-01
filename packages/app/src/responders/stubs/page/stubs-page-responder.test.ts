import { themedRenderMiddleware } from '../../../middleware/themed-render/themed-render-middleware';
import { StubsPageResponder } from './stubs-page-responder';
import { StubsPageResponderProxy } from './stubs-page-responder.proxy';
import { StubViewStub } from '@assayer/shared/contracts/stub-view/stub-view.stub';
import { createElement } from '#gateway/npm/react';

describe('StubsPageResponder', () => {
  describe('rendering the stubs page', () => {
    it('VALID: {stub view resolved} => renders the stub repository', async () => {
      const proxy = StubsPageResponderProxy();
      proxy.setupView({ view: StubViewStub() });

      const { findByTestId } = themedRenderMiddleware({
        ui: createElement(StubsPageResponder),
      });
      const panel = await findByTestId('STUB_REPOSITORY');

      expect(panel).toBeInTheDocument();
    });
  });
});
