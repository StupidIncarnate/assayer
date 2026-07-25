import { isFalsyArmGuard } from './is-falsy-arm-guard';

describe('isFalsyArmGuard', () => {
  describe('a truthiness read', () => {
    // The else arm of `if (config.db)` — and, identically, the then arm of `if (!config.db)`, which the
    // walk records as this same leaf with `want` flipped.
    it('VALID: {truthy, want: false} => true', () => {
      expect(isFalsyArmGuard({ predicateKind: 'truthy', want: false })).toBe(true);
    });

    it('VALID: {truthy, want: true} => false', () => {
      expect(isFalsyArmGuard({ predicateKind: 'truthy', want: true })).toBe(false);
    });

    it('VALID: {falsy, want: true} => true', () => {
      expect(isFalsyArmGuard({ predicateKind: 'falsy', want: true })).toBe(true);
    });

    it('VALID: {falsy, want: false} => false', () => {
      expect(isFalsyArmGuard({ predicateKind: 'falsy', want: false })).toBe(false);
    });
  });

  // `a ?? b` falls through when its operand IS nullish, and null is falsy — the same demand no
  // constructed object or array can meet.
  describe('a nullish-coalescing operand', () => {
    it('VALID: {non-nullish, want: false} => true', () => {
      expect(isFalsyArmGuard({ predicateKind: 'non-nullish', want: false })).toBe(true);
    });

    it('VALID: {non-nullish, want: true} => false', () => {
      expect(isFalsyArmGuard({ predicateKind: 'non-nullish', want: true })).toBe(false);
    });
  });

  // A comparison names its own point, so the domain engine answers it and this guard must not.
  describe('a predicate that names a value point', () => {
    it('VALID: {eq, want: false} => false', () => {
      expect(isFalsyArmGuard({ predicateKind: 'eq', want: false })).toBe(false);
    });

    it('VALID: {length-gt, want: false} => false', () => {
      expect(isFalsyArmGuard({ predicateKind: 'length-gt', want: false })).toBe(false);
    });

    it('VALID: {unrecognized, want: false} => false', () => {
      expect(isFalsyArmGuard({ predicateKind: 'unrecognized', want: false })).toBe(false);
    });
  });

  describe('a missing input', () => {
    it('EMPTY: {no arm} => false', () => {
      expect(isFalsyArmGuard({ predicateKind: 'truthy' })).toBe(false);
    });

    it('EMPTY: {no kind} => false', () => {
      expect(isFalsyArmGuard({ want: false })).toBe(false);
    });

    it('EMPTY: {neither} => false', () => {
      expect(isFalsyArmGuard({})).toBe(false);
    });
  });
});
