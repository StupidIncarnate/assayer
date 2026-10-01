import { UndrivenEntryStub } from '@assayer/shared/contracts/undriven-entry/undriven-entry.stub';

import { undrivenLineFormatTransformer } from './undriven-line-format-transformer';

describe('undrivenLineFormatTransformer', () => {
  describe('an undriven entry with no label', () => {
    it('VALID: {name: "inner", reason: "it is not exported"} => the UNDRIVEN marker, name, and reason', () => {
      const result = undrivenLineFormatTransformer({
        entry: UndrivenEntryStub({ name: 'inner', reason: 'it is not exported' }),
      });

      expect(result).toBe('  UNDRIVEN inner — it is not exported');
    });
  });

  describe('an undriven module entry with a label', () => {
    // The label wins over the internal `*module*` name — the reader never meets the cache key.
    it('VALID: {name: "*module*", label: "welded-const.ts"} => the label, never the internal name', () => {
      const result = undrivenLineFormatTransformer({
        entry: UndrivenEntryStub({ name: '*module*', label: 'welded-const.ts', reason: 'it runs at import time' }),
      });

      expect(result).toBe('  UNDRIVEN welded-const.ts — it runs at import time');
    });
  });
});
