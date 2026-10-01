import { MantineProvider } from '#gateway/npm/mantine__core';
import { render } from '#gateway/npm/testing-library__react';
import { ExplorerPageResponder } from './explorer-page-responder';
import { ExplorerPageResponderProxy } from './explorer-page-responder.proxy';
import { CompiledTreeStub } from '@assayer/shared/contracts/compiled-tree/compiled-tree.stub';
import { createElement } from '#gateway/npm/react';

describe('ExplorerPageResponder', () => {
  describe('rendering the explorer page', () => {
    it('VALID: {surface resolved} => renders the surface explorer', async () => {
      const proxy = ExplorerPageResponderProxy();
      proxy.setupTree({ tree: CompiledTreeStub() });

      const { findByTestId } = render(createElement(ExplorerPageResponder), { wrapper: MantineProvider });
      const panel = await findByTestId('SURFACE_EXPLORER');

      expect(panel).toBeInTheDocument();
    });
  });
});
