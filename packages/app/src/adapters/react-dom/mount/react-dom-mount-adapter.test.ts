import { document } from '#gateway/browser/document';
import { act, createElement } from 'react';

import { reactDomMountAdapter } from './react-dom-mount-adapter';
import { reactDomMountAdapterProxy } from './react-dom-mount-adapter.proxy';

describe('reactDomMountAdapter', () => {
  describe('mounting content', () => {
    it('VALID: {container, content} => mounts and returns success', () => {
      reactDomMountAdapterProxy();
      const container = document.createElement('div');

      const results: unknown[] = [];
      act(() => {
        results.push(
          reactDomMountAdapter({ container, content: createElement('span', null, 'mounted') }),
        );
      });

      expect(results).toStrictEqual([{ success: true }]);
    });
  });
});
