import { LintEntryStub } from '@assayer/shared/contracts';

import { lintLineFormatTransformer } from './lint-line-format-transformer';

describe('lintLineFormatTransformer', () => {
  describe('a lint', () => {
    it('VALID: {name: "decide", message: "nothing calls it"} => the LINT marker, name, and message', () => {
      const result = lintLineFormatTransformer({ lint: LintEntryStub({ name: 'decide', message: 'nothing calls it' }) });

      expect(result).toBe('  LINT decide — nothing calls it');
    });
  });
});
