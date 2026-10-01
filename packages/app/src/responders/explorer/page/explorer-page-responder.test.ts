import { reactCreateElementAdapter } from '../../../adapters/react/create-element/react-create-element-adapter';
import { themedRenderMiddleware } from '../../../middleware/themed-render/themed-render-middleware';
import { ExplorerPageResponder } from './explorer-page-responder';
import { ExplorerPageResponderProxy } from './explorer-page-responder.proxy';
import { CompiledTreeStub } from '@assayer/shared/contracts';

describe('ExplorerPageResponder', () => {
  describe('rendering the explorer page', () => {
    it('VALID: {surface resolved} => renders the surface explorer', async () => {
      const proxy = ExplorerPageResponderProxy();
      proxy.setupTree({ tree: CompiledTreeStub() });

      const { findByTestId } = themedRenderMiddleware({
        ui: reactCreateElementAdapter({ component: ExplorerPageResponder }),
      });
      const panel = await findByTestId('SURFACE_EXPLORER');

      expect(panel).toBeInTheDocument();
    });
  });
});
