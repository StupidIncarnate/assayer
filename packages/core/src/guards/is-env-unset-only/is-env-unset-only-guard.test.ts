import { EnvStepStub } from '@assayer/shared/contracts/env-step/env-step.stub';
import { PredicateStub } from '@assayer/shared/contracts/predicate/predicate.stub';

import { isEnvUnsetOnlyGuard } from './is-env-unset-only-guard';

describe('isEnvUnsetOnlyGuard', () => {
  describe('reads met only by an unset variable', () => {
    it('VALID: {raw read, undefined-eq, wants true} => true', () => {
      expect(isEnvUnsetOnlyGuard({ steps: [], predicate: PredicateStub({ kind: 'undefined-eq' }), want: true })).toBe(true);
    });

    it('VALID: {raw read, undefined-neq, wants false} => true', () => {
      expect(isEnvUnsetOnlyGuard({ steps: [], predicate: PredicateStub({ kind: 'undefined-neq' }), want: false })).toBe(true);
    });

    it('VALID: {guard, number, non-nullish, wants false} => true, since the guard is nullish only when unset', () => {
      expect(
        isEnvUnsetOnlyGuard({
          steps: [EnvStepStub({ kind: 'guard' }), EnvStepStub({ kind: 'number' })],
          predicate: PredicateStub({ kind: 'non-nullish' }),
          want: false,
        }),
      ).toBe(true);
    });
  });

  describe('reads a set variable can meet', () => {
    it('VALID: {raw read, undefined-eq, wants false} => false', () => {
      expect(isEnvUnsetOnlyGuard({ steps: [], predicate: PredicateStub({ kind: 'undefined-eq' }), want: false })).toBe(false);
    });

    it('VALID: {raw read, undefined-neq, wants true} => false', () => {
      expect(isEnvUnsetOnlyGuard({ steps: [], predicate: PredicateStub({ kind: 'undefined-neq' }), want: true })).toBe(false);
    });

    it('VALID: {raw read, falsy} => false, since the empty string is falsy too', () => {
      expect(isEnvUnsetOnlyGuard({ steps: [], predicate: PredicateStub({ kind: 'falsy' }), want: true })).toBe(false);
    });

    it("VALID: {default '', non-nullish, wants false} => false, since the fallback is never nullish", () => {
      expect(
        isEnvUnsetOnlyGuard({
          steps: [EnvStepStub({ kind: 'default', value: '' })],
          predicate: PredicateStub({ kind: 'non-nullish' }),
          want: false,
        }),
      ).toBe(false);
    });

    it('EMPTY: {steps: undefined} => false', () => {
      expect(isEnvUnsetOnlyGuard({ predicate: PredicateStub({ kind: 'undefined-eq' }), want: true })).toBe(false);
    });
  });
});
