import { createElement } from '#gateway/npm/react';

import { themedRenderMiddleware } from './themed-render-middleware';
import { themedRenderMiddlewareProxy } from './themed-render-middleware.proxy';

describe('themedRenderMiddleware', () => {
  describe('rendering an element', () => {
    it('VALID: {ui} => renders the element inside a Mantine provider', () => {
      themedRenderMiddlewareProxy();

      const { getByText } = themedRenderMiddleware({
        ui: createElement('span', null, 'rendered content'),
      });

      expect(getByText('rendered content')).toBeInTheDocument();
    });
  });
});
