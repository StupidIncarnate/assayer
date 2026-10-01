import { document } from '#gateway/browser/document';
import { act, createElement } from '#gateway/npm/react';
import { screen } from '#gateway/npm/testing-library__react';

import { reactCreateElementAdapter } from '../../../adapters/react/create-element/react-create-element-adapter';
import { AppMountResponder } from './app-mount-responder';
import { AppMountResponderProxy } from './app-mount-responder.proxy';

describe('AppMountResponder', () => {
  describe('mounting the app', () => {
    it('VALID: {content, #root present} => renders the content into #root', () => {
      AppMountResponderProxy();
      document.body.innerHTML = '<div id="root"></div>';
      const content = reactCreateElementAdapter({ component: () => createElement('span', { 'data-testid': 'app' }, 'app') });

      act(() => {
        AppMountResponder({ content });
      });

      expect(screen.getByTestId('app').textContent).toBe('app');
    });
  });
});
