import { entryGapContract } from './entry-gap-contract';
import { EntryGapStub } from './entry-gap.stub';

describe('entryGapContract', () => {
  describe('valid entry gaps', () => {
    it('VALID: {stub default} => parses an access gap carrying the entry it names and why', () => {
      const gap = EntryGapStub();

      const result = entryGapContract.parse(gap);

      expect(result).toStrictEqual({
        name: 'find',
        reason: 'its class needs constructor arguments, so no instance can be built to drive it — needs a harness',
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
