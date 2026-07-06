import { createElement } from 'react';

import { testingLibraryRenderAdapter } from './testing-library-render-adapter';
import { testingLibraryRenderAdapterProxy } from './testing-library-render-adapter.proxy';

describe('testingLibraryRenderAdapter', () => {
  describe('rendering an element', () => {
    it('VALID: {ui} => renders the element inside a Mantine provider', () => {
      testingLibraryRenderAdapterProxy();

      const { getByText } = testingLibraryRenderAdapter({
        ui: createElement('span', null, 'rendered content'),
      });

      expect(getByText('rendered content')).toBeInTheDocument();
    });
  });
});
