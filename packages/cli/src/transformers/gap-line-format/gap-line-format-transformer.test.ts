import { EntryGapStub } from '@assayer/shared/contracts';

import { gapLineFormatTransformer } from './gap-line-format-transformer';

describe('gapLineFormatTransformer', () => {
  describe('a gap', () => {
    it('VALID: {name: "find", reason: "needs a harness"} => the GAP marker, name, and reason', () => {
      const result = gapLineFormatTransformer({ gap: EntryGapStub({ name: 'find', reason: 'needs a harness' }) });

      expect(result).toBe('  GAP find — needs a harness');
    });
  });
});
