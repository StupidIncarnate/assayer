import { entryGapContract } from './entry-gap-contract';
import { EntryGapStub } from './entry-gap.stub';

describe('entryGapContract', () => {
  describe('valid entry gaps', () => {
    it('VALID: {stub default} => parses an access gap carrying the entry it names and why', () => {
      const gap = EntryGapStub();

      const result = entryGapContract.parse(gap);

      expect(result).toStrictEqual({
        name: 'audit',
        reason:
          '`audit` derives no case, because Assayer cannot construct an input it needs. It builds inputs ' +
          'out of declared DATA — a scalar, a union, an array, or an object shape whose every property is ' +
          'itself one — and refuses anything that bottoms out in a function or in a type carrying nothing but ' +
          'its name: `report: (message: string) => string`. Substituting a stand-in would be worse than ' +
          'deriving nothing: code that CALLS the value throws on it, and code that merely measures it passes ' +
          'on something nobody supplied. Assayer read the signature perfectly — this is not syntax it missed ' +
          "— so the value is the caller's to supply. Colocate a harness with this file, the same basename " +
          "with a `.harness.ts` extension, and declare the input: `import { assayerHarness } from '@assayer/core'; " +
          'assayerHarness({ inputs: { audit: { report: <a (message: string) => string> } } });`. Assayer then ' +
          'builds them from that declaration instead of refusing them; anything else still standing between ' +
          '`audit` and a case is reported on its own line.',
      });
    });

    it('VALID: {an input gap} => the same shape carries the other producer, with no second spelling', () => {
      const result = entryGapContract.parse({ name: 'audit', reason: 'the fill seam refuses `report`' });

      expect(result).toStrictEqual({ name: 'audit', reason: 'the fill seam refuses `report`' });
    });
  });

  describe('invalid entry gaps', () => {
    it('INVALID: {reason: ""} => throws, since a gap nobody can act on invoices nothing', () => {
      expect(() => {
        return entryGapContract.parse({ name: 'audit', reason: '' });
      }).toThrow(/reason/u);
    });

    it('INVALID: {no name} => throws, since a gap that names no entry cannot be paired with one', () => {
      expect(() => {
        return entryGapContract.parse({ reason: 'needs a harness' });
      }).toThrow(/name/u);
    });
  });
});
