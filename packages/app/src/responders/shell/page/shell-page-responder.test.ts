import { AppShellWidget } from '../../../widgets/app-shell/app-shell-widget';
import { ShellPageResponder } from './shell-page-responder';
import { ShellPageResponderProxy } from './shell-page-responder.proxy';

describe('ShellPageResponder', () => {
  describe('producing the shell element', () => {
    it('VALID: {} => produces the app-shell widget element for the layout route', () => {
      ShellPageResponderProxy();

      const element = ShellPageResponder();

      expect(element.type).toBe(AppShellWidget);
    });
  });
});
