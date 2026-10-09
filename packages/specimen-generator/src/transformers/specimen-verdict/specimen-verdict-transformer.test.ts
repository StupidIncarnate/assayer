import { specimenVerdictTransformer } from './specimen-verdict-transformer';

describe('specimenVerdictTransformer', () => {
  describe('a leaf from outside the program', () => {
    it('VALID: {provenances: [external]} => returns undriven', () => {
      expect(specimenVerdictTransformer({ provenances: ['external'] })).toBe('undriven');
    });

    it('VALID: {provenances: [param, external]} => returns undriven, because no test can set the external leaf', () => {
      expect(specimenVerdictTransformer({ provenances: ['param', 'external'] })).toBe('undriven');
    });
  });

  describe('a leaf a test sets', () => {
    it('VALID: {provenances: [param]} => returns driven', () => {
      expect(specimenVerdictTransformer({ provenances: ['param'] })).toBe('driven');
    });

    it('VALID: {provenances: [env, literal]} => returns driven', () => {
      expect(specimenVerdictTransformer({ provenances: ['env', 'literal'] })).toBe('driven');
    });
  });

  describe('every leaf known', () => {
    it('VALID: {provenances: [const]} => returns locked', () => {
      expect(specimenVerdictTransformer({ provenances: ['const'] })).toBe('locked');
    });

    it('VALID: {provenances: [literal, const]} => returns locked', () => {
      expect(specimenVerdictTransformer({ provenances: ['literal', 'const'] })).toBe('locked');
    });

    it('EMPTY: {provenances: []} => returns locked, because nothing is left to set', () => {
      expect(specimenVerdictTransformer({ provenances: [] })).toBe('locked');
    });
  });

  describe('a pinned leaf', () => {
    it('ERROR: {provenances: [random]} => throws, naming the provenances and the fix', () => {
      expect(() => specimenVerdictTransformer({ provenances: ['random'] })).toThrow(
        /^specimen verdict: a leaf has a pinned provenance \(random\), and no verdict rule covers pinning yet\. Remove 'random' from matrixStatics\.provenances, or add a pinning rule here\.$/u,
      );
    });
  });
});
