import { StatusShowResponder } from './status-show-responder';
import { StatusShowResponderProxy } from './status-show-responder.proxy';

describe('StatusShowResponder', () => {
  describe('core status', () => {
    it('VALID: {} => returns the version and readiness message as CLI output', () => {
      StatusShowResponderProxy();

      const result = StatusShowResponder();

      expect(result).toBe('assayer 1.0.0\nAssayer core online');
    });
  });
});
