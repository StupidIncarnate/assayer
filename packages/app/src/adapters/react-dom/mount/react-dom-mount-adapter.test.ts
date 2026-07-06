import { createElement } from 'react';

import { reactDomMountAdapter } from './react-dom-mount-adapter';
import { reactDomMountAdapterProxy } from './react-dom-mount-adapter.proxy';

describe('reactDomMountAdapter', () => {
  describe('mounting content', () => {
    it('VALID: {container, content} => mounts and returns success', () => {
      reactDomMountAdapterProxy();
      const container = document.createElement('div');

      const result = reactDomMountAdapter({
        container,
        content: createElement('span', null, 'mounted'),
      });

      expect(result).toStrictEqual({ success: true });
    });
  });
});
