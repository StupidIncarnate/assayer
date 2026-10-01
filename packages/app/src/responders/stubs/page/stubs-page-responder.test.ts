import { MantineProvider } from '#gateway/npm/mantine__core';
import { render } from '#gateway/npm/testing-library__react';
import { StubsPageResponder } from './stubs-page-responder';
import { StubsPageResponderProxy } from './stubs-page-responder.proxy';
import { StubViewStub } from '@assayer/shared/contracts/stub-view/stub-view.stub';
import { createElement } from '#gateway/npm/react';

describe('StubsPageResponder', () => {
  describe('rendering the stubs page', () => {
    it('VALID: {stub view resolved} => renders the stub repository', async () => {
      const proxy = StubsPageResponderProxy();
      proxy.setupView({ view: StubViewStub() });

      const { findByTestId } = render(createElement(StubsPageResponder), { wrapper: MantineProvider });
      const panel = await findByTestId('STUB_REPOSITORY');

      expect(panel).toBeInTheDocument();
    });
  });
});
