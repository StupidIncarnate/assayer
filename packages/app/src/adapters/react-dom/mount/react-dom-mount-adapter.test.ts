import { document } from '#gateway/browser/document';
import { act, createElement } from '#gateway/npm/react';
import { screen } from '#gateway/npm/testing-library__react';

import { reactDomMountAdapter } from './react-dom-mount-adapter';
import { reactDomMountAdapterProxy } from './react-dom-mount-adapter.proxy';

describe('reactDomMountAdapter', () => {
  describe('mounting content', () => {
    it('VALID: {container, content} => renders the content into the container', () => {
      reactDomMountAdapterProxy();
      const container = document.createElement('div');
      document.body.appendChild(container);

      act(() => {
        reactDomMountAdapter({ container, content: createElement('span', { 'data-testid': 'mounted' }, 'mounted') });
      });

      expect(screen.getByTestId('mounted').textContent).toBe('mounted');
    });
  });
});
