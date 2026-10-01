import { document } from '#gateway/browser/document';
import { act } from 'react';

import { reactCreateElementAdapter } from '../../../adapters/react/create-element/react-create-element-adapter';
import { AppMountResponder } from './app-mount-responder';
import { AppMountResponderProxy } from './app-mount-responder.proxy';

describe('AppMountResponder', () => {
  describe('mounting the app', () => {
    it('VALID: {content, #root present} => mounts and returns success', () => {
      AppMountResponderProxy();
      document.body.innerHTML = '<div id="root"></div>';
      const content = reactCreateElementAdapter({ component: (): null => null });

      const results: unknown[] = [];
      act(() => {
        results.push(AppMountResponder({ content }));
      });

      expect(results).toStrictEqual([{ success: true }]);
    });
  });
});
