import { reactCreateElementAdapter } from '../../../adapters/react/create-element/react-create-element-adapter';
import { AppMountResponder } from './app-mount-responder';
import { AppMountResponderProxy } from './app-mount-responder.proxy';

describe('AppMountResponder', () => {
  describe('mounting the app', () => {
    it('VALID: {content, #root present} => mounts and returns success', () => {
      AppMountResponderProxy();
      document.body.innerHTML = '<div id="root"></div>';
      const content = reactCreateElementAdapter({ component: (): null => null });

      const result = AppMountResponder({ content });

      expect(result).toStrictEqual({ success: true });
    });
  });
});
