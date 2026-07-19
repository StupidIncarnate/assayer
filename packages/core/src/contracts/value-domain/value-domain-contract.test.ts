import { valueDomainContract } from './value-domain-contract';
import { ValueDomainStub } from './value-domain.stub';

describe('valueDomainContract', () => {
  describe('valid value domains', () => {
    it('VALID: {stub default} => parses to the same shape', () => {
      const domain = ValueDomainStub();

      const result = valueDomainContract.parse(domain);

      expect(result).toStrictEqual(domain);
    });

    // The defaults ARE the semantics: an object saying nothing must mean "constrains nothing", never
    // "constrains everything". A domain that defaulted to closed would report every unread predicate
    // as an impossible path.
    it('EMPTY: {no fields} => an open domain with no members and no exclusions', () => {
      const result = valueDomainContract.parse({});

      expect(result).toStrictEqual({
        minExclusive: false,
        maxExclusive: false,
        lengthMinExclusive: false,
        lengthMaxExclusive: false,
        lengthExcluded: [],
        excluded: [],
      });
    });

    // The two axes are independent by construction: a guard may bound what a string IS and what it
    // MEASURES without either constraint implying the other.
    it('VALID: {a length-bounded domain} => keeps the length axis apart from the value axis', () => {
      const result = valueDomainContract.parse({ lengthMin: 2, lengthMax: 5 });

      expect(result).toStrictEqual({
        minExclusive: false,
        maxExclusive: false,
        lengthMin: 2,
        lengthMinExclusive: false,
        lengthMax: 5,
        lengthMaxExclusive: false,
        lengthExcluded: [],
        excluded: [],
      });
    });

    // Present-and-empty is a REAL state and must survive parsing distinct from absent: `members: []`
    // is "nothing satisfies this", which is exactly what proves an exit unreachable.
    it('EDGE: {members: []} => keeps the empty enumeration rather than dropping it', () => {
      const result = valueDomainContract.parse({ members: [] });

      expect(result).toStrictEqual({
        minExclusive: false,
        maxExclusive: false,
        lengthMinExclusive: false,
        lengthMaxExclusive: false,
        lengthExcluded: [],
        members: [],
        excluded: [],
      });
    });

    it('VALID: {a bounded numeric domain} => keeps both bounds and their exclusivity', () => {
      const result = valueDomainContract.parse({ min: 10, minExclusive: true, max: 100 });

      expect(result).toStrictEqual({
        min: 10,
        minExclusive: true,
        max: 100,
        maxExclusive: false,
        lengthMinExclusive: false,
        lengthMaxExclusive: false,
        lengthExcluded: [],
        excluded: [],
      });
    });
  });

  describe('invalid value domains', () => {
    it('INVALID: {min: "10"} => throws validation error', () => {
      expect(() => {
        return valueDomainContract.parse({ min: '10' });
      }).toThrow(/Expected number, received string/u);
    });

    it('INVALID: {excluded: [{}]} => throws validation error', () => {
      expect(() => {
        return valueDomainContract.parse({ excluded: [{}] });
      }).toThrow(/Invalid input/u);
    });
  });
});
