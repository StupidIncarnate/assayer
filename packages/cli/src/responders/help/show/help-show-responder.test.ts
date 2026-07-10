import { cliUsageStatics } from '../../../statics/cli-usage/cli-usage-statics';

import { HelpShowResponder } from './help-show-responder';
import { HelpShowResponderProxy } from './help-show-responder.proxy';

describe('HelpShowResponder', () => {
  describe('usage banner', () => {
    it('VALID: {} => returns the exact text of cliUsageStatics.text as CliOutput', () => {
      HelpShowResponderProxy();

      const result = HelpShowResponder();

      expect(result).toBe(cliUsageStatics.text);
    });
  });
});
