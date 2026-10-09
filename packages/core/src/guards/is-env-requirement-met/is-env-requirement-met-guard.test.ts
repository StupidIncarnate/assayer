import { EnvStepStub } from '@assayer/shared/contracts/env-step/env-step.stub';
import { PredicateStub } from '@assayer/shared/contracts/predicate/predicate.stub';

import { isEnvRequirementMetGuard } from './is-env-requirement-met-guard';

describe('isEnvRequirementMetGuard', () => {
  describe('comparisons after Number', () => {
    it('VALID: {Number > 5, wants true, raw "6"} => true', () => {
      expect(
        isEnvRequirementMetGuard({
          steps: [EnvStepStub({ kind: 'number' })],
          predicate: PredicateStub({ kind: 'gt', literal: 5 }),
          want: true,
          raw: '6',
        }),
      ).toBe(true);
    });

    it('INVALID: {Number > 5, wants true, raw "abc"} => false, since Number gives NaN', () => {
      expect(
        isEnvRequirementMetGuard({
          steps: [EnvStepStub({ kind: 'number' })],
          predicate: PredicateStub({ kind: 'gt', literal: 5 }),
          want: true,
          raw: 'abc',
        }),
      ).toBe(false);
    });

    it('VALID: {Number <= 5, wants false via gt, raw "5"} => true', () => {
      expect(
        isEnvRequirementMetGuard({
          steps: [EnvStepStub({ kind: 'number' })],
          predicate: PredicateStub({ kind: 'gt', literal: 5 }),
          want: false,
          raw: '5',
        }),
      ).toBe(true);
    });

    it('VALID: {Number >= 5, raw "5"} => true', () => {
      expect(
        isEnvRequirementMetGuard({ steps: [EnvStepStub({ kind: 'number' })], predicate: PredicateStub({ kind: 'gte', literal: 5 }), want: true, raw: '5' }),
      ).toBe(true);
    });

    it('VALID: {Number < 5, raw "4"} => true', () => {
      expect(
        isEnvRequirementMetGuard({ steps: [EnvStepStub({ kind: 'number' })], predicate: PredicateStub({ kind: 'lt', literal: 5 }), want: true, raw: '4' }),
      ).toBe(true);
    });

    it('VALID: {Number <= 5, raw "6"} => false', () => {
      expect(
        isEnvRequirementMetGuard({ steps: [EnvStepStub({ kind: 'number' })], predicate: PredicateStub({ kind: 'lte', literal: 5 }), want: true, raw: '6' }),
      ).toBe(false);
    });

    it('VALID: {Number === 7, raw "7"} => true', () => {
      expect(
        isEnvRequirementMetGuard({ steps: [EnvStepStub({ kind: 'number' })], predicate: PredicateStub({ kind: 'eq', literal: 7 }), want: true, raw: '7' }),
      ).toBe(true);
    });

    it('VALID: {Number !== 7, raw "7"} => false', () => {
      expect(
        isEnvRequirementMetGuard({ steps: [EnvStepStub({ kind: 'number' })], predicate: PredicateStub({ kind: 'neq', literal: 7 }), want: true, raw: '7' }),
      ).toBe(false);
    });
  });

  describe('comparisons on the raw string', () => {
    it("VALID: {> 'b', raw 'c'} => true, by the string ordering", () => {
      expect(isEnvRequirementMetGuard({ steps: [], predicate: PredicateStub({ kind: 'gt', literal: 'b' }), want: true, raw: 'c' })).toBe(true);
    });

    it('VALID: {truthy, raw ""} => false, since the empty string is falsy', () => {
      expect(isEnvRequirementMetGuard({ steps: [], predicate: PredicateStub({ kind: 'truthy' }), want: true, raw: '' })).toBe(false);
    });

    it('VALID: {falsy, unset} => true', () => {
      expect(isEnvRequirementMetGuard({ steps: [], predicate: PredicateStub({ kind: 'falsy' }), want: true })).toBe(true);
    });

    it('VALID: {non-nullish, wants false, unset} => true', () => {
      expect(isEnvRequirementMetGuard({ steps: [], predicate: PredicateStub({ kind: 'non-nullish' }), want: false })).toBe(true);
    });

    it('VALID: {undefined-eq, wants true, unset} => true', () => {
      expect(isEnvRequirementMetGuard({ steps: [], predicate: PredicateStub({ kind: 'undefined-eq' }), want: true })).toBe(true);
    });

    it('INVALID: {undefined-eq, wants true, raw ""} => false, since the empty string is set', () => {
      expect(isEnvRequirementMetGuard({ steps: [], predicate: PredicateStub({ kind: 'undefined-eq' }), want: true, raw: '' })).toBe(false);
    });

    it('VALID: {undefined-neq, wants true, raw ""} => true', () => {
      expect(isEnvRequirementMetGuard({ steps: [], predicate: PredicateStub({ kind: 'undefined-neq' }), want: true, raw: '' })).toBe(true);
    });

    it("VALID: {typeof-eq 'string', raw 'a'} => true", () => {
      expect(
        isEnvRequirementMetGuard({ steps: [], predicate: PredicateStub({ kind: 'typeof-eq', literal: 'string' }), want: true, raw: 'a' }),
      ).toBe(true);
    });

    it("VALID: {typeof-neq 'string', unset} => true", () => {
      expect(
        isEnvRequirementMetGuard({ steps: [], predicate: PredicateStub({ kind: 'typeof-neq', literal: 'string' }), want: true }),
      ).toBe(true);
    });

    it('VALID: {unrecognized} => true, since there is nothing to contradict', () => {
      expect(isEnvRequirementMetGuard({ steps: [], predicate: PredicateStub({ kind: 'unrecognized' }), want: false, raw: 'a' })).toBe(true);
    });
  });

  describe('length comparisons', () => {
    it("VALID: {split ',', length-eq 2, raw 'a,b'} => true", () => {
      expect(
        isEnvRequirementMetGuard({
          steps: [EnvStepStub({ kind: 'split', separator: ',' })],
          predicate: PredicateStub({ kind: 'length-eq', literal: 2 }),
          want: true,
          raw: 'a,b',
        }),
      ).toBe(true);
    });

    it("VALID: {length-neq 0, raw ''} => false", () => {
      expect(
        isEnvRequirementMetGuard({ steps: [], predicate: PredicateStub({ kind: 'length-neq', literal: 0 }), want: true, raw: '' }),
      ).toBe(false);
    });

    it("VALID: {length-gt 1, raw 'ab'} => true", () => {
      expect(
        isEnvRequirementMetGuard({ steps: [], predicate: PredicateStub({ kind: 'length-gt', literal: 1 }), want: true, raw: 'ab' }),
      ).toBe(true);
    });

    it("VALID: {length-gte 2, raw 'ab'} => true", () => {
      expect(
        isEnvRequirementMetGuard({ steps: [], predicate: PredicateStub({ kind: 'length-gte', literal: 2 }), want: true, raw: 'ab' }),
      ).toBe(true);
    });

    it("VALID: {length-lt 2, raw 'ab'} => false", () => {
      expect(
        isEnvRequirementMetGuard({ steps: [], predicate: PredicateStub({ kind: 'length-lt', literal: 2 }), want: true, raw: 'ab' }),
      ).toBe(false);
    });

    it("VALID: {length-lte 2, raw 'ab'} => true", () => {
      expect(
        isEnvRequirementMetGuard({ steps: [], predicate: PredicateStub({ kind: 'length-lte', literal: 2 }), want: true, raw: 'ab' }),
      ).toBe(true);
    });

    it('INVALID: {length-eq 0, unset} => false, since reading .length of undefined throws', () => {
      expect(isEnvRequirementMetGuard({ steps: [], predicate: PredicateStub({ kind: 'length-eq', literal: 0 }), want: true })).toBe(false);
    });

    it("ERROR: {split ',', length-eq 1, unset} => false, since the split throws first", () => {
      expect(
        isEnvRequirementMetGuard({
          steps: [EnvStepStub({ kind: 'split', separator: ',' })],
          predicate: PredicateStub({ kind: 'length-eq', literal: 1 }),
          want: true,
        }),
      ).toBe(false);
    });
  });

  describe('a guard chain', () => {
    it('VALID: {guard, number, truthy, wants false, unset} => true, since undefined is falsy', () => {
      expect(
        isEnvRequirementMetGuard({
          steps: [EnvStepStub({ kind: 'guard' }), EnvStepStub({ kind: 'number' })],
          predicate: PredicateStub({ kind: 'truthy' }),
          want: false,
        }),
      ).toBe(true);
    });

    it('INVALID: {guard, number, truthy, wants true, unset} => false', () => {
      expect(
        isEnvRequirementMetGuard({
          steps: [EnvStepStub({ kind: 'guard' }), EnvStepStub({ kind: 'number' })],
          predicate: PredicateStub({ kind: 'truthy' }),
          want: true,
        }),
      ).toBe(false);
    });
  });

  describe('steps run forward', () => {
    it("VALID: {default 'x', eq 'x', unset} => true, since an unset variable falls back", () => {
      expect(
        isEnvRequirementMetGuard({
          steps: [EnvStepStub({ kind: 'default', value: 'x' })],
          predicate: PredicateStub({ kind: 'eq', literal: 'x' }),
          want: true,
        }),
      ).toBe(true);
    });

    it("VALID: {default 'x', eq 'x', raw ''} => false, since only an unset variable falls back", () => {
      expect(
        isEnvRequirementMetGuard({
          steps: [EnvStepStub({ kind: 'default', value: 'x' })],
          predicate: PredicateStub({ kind: 'eq', literal: 'x' }),
          want: true,
          raw: '',
        }),
      ).toBe(false);
    });

    it("VALID: {negated equals 'off', truthy, raw 'off'} => false", () => {
      expect(
        isEnvRequirementMetGuard({
          steps: [EnvStepStub({ kind: 'equals', literal: 'off', negated: true })],
          predicate: PredicateStub({ kind: 'truthy' }),
          want: true,
          raw: 'off',
        }),
      ).toBe(false);
    });

    it("VALID: {split ',', map, length-eq 3, raw 'a,b,c'} => true, since map keeps the length", () => {
      expect(
        isEnvRequirementMetGuard({
          steps: [EnvStepStub({ kind: 'split', separator: ',' }), EnvStepStub({ kind: 'map' })],
          predicate: PredicateStub({ kind: 'length-eq', literal: 3 }),
          want: true,
          raw: 'a,b,c',
        }),
      ).toBe(true);
    });

    it("ERROR: {map on a string, raw 'a'} => false, since only an array has map here", () => {
      expect(
        isEnvRequirementMetGuard({
          steps: [EnvStepStub({ kind: 'map' })],
          predicate: PredicateStub({ kind: 'length-eq', literal: 1 }),
          want: true,
          raw: 'a',
        }),
      ).toBe(false);
    });

    it('VALID: {guard, number, raw "7", eq 7} => true, since the guard passes a set variable through', () => {
      expect(
        isEnvRequirementMetGuard({
          steps: [EnvStepStub({ kind: 'guard' }), EnvStepStub({ kind: 'number' })],
          predicate: PredicateStub({ kind: 'eq', literal: 7 }),
          want: true,
          raw: '7',
        }),
      ).toBe(true);
    });

    it('VALID: {guard, number, default 0, eq 0, unset} => true, since the guard resumes at the fallback', () => {
      expect(
        isEnvRequirementMetGuard({
          steps: [EnvStepStub({ kind: 'guard' }), EnvStepStub({ kind: 'number' }), EnvStepStub({ kind: 'default', value: 0 })],
          predicate: PredicateStub({ kind: 'eq', literal: 0 }),
          want: true,
        }),
      ).toBe(true);
    });
  });

  describe('missing inputs', () => {
    it('EMPTY: {steps: undefined} => false', () => {
      expect(isEnvRequirementMetGuard({ predicate: PredicateStub(), want: true })).toBe(false);
    });

    it('EMPTY: {predicate: undefined} => false', () => {
      expect(isEnvRequirementMetGuard({ steps: [], want: true })).toBe(false);
    });

    it('EMPTY: {want: undefined} => false', () => {
      expect(isEnvRequirementMetGuard({ steps: [], predicate: PredicateStub() })).toBe(false);
    });
  });
});
