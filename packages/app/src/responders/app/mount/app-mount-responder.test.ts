import { AppMountResponder } from './app-mount-responder';
import { AppMountResponderProxy } from './app-mount-responder.proxy';
import { StatusViewStub } from '../../../contracts/status-view/status-view.stub';

describe('AppMountResponder', () => {
  describe('mounting the app', () => {
    it('VALID: {#root present} => mounts and returns success', () => {
      const proxy = AppMountResponderProxy();
      proxy.setupStatus({ status: StatusViewStub() });
      document.body.innerHTML = '<div id="root"></div>';

      const result = AppMountResponder();

      expect(result).toStrictEqual({ success: true });
    });
  });
});
