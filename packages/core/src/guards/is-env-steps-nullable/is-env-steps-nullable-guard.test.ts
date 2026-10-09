import { EnvStepStub } from '@assayer/shared/contracts/env-step/env-step.stub';

import { isEnvStepsNullableGuard } from './is-env-steps-nullable-guard';

describe('isEnvStepsNullableGuard', () => {
  describe('chains that can hold undefined', () => {
    it('EMPTY: {steps: []} => true, since the raw read is undefined when the variable is unset', () => {
      expect(isEnvStepsNullableGuard({ steps: [] })).toBe(true);
    });

    it('VALID: {guard, number} => true, since the guard keeps an unset variable undefined', () => {
      expect(isEnvStepsNullableGuard({ steps: [EnvStepStub({ kind: 'guard' }), EnvStepStub({ kind: 'number' })] })).toBe(true);
    });
  });

  describe('chains that always hold a value', () => {
    it('VALID: {number} => false, since Number always returns a number', () => {
      expect(isEnvStepsNullableGuard({ steps: [EnvStepStub({ kind: 'number' })] })).toBe(false);
    });

    it("VALID: {default ''} => false, since the fallback replaces an unset variable", () => {
      expect(isEnvStepsNullableGuard({ steps: [EnvStepStub({ kind: 'default', value: '' })] })).toBe(false);
    });

    it('VALID: {guard, number, default 0} => false, since the fallback after the guard replaces undefined', () => {
      expect(
        isEnvStepsNullableGuard({
          steps: [EnvStepStub({ kind: 'guard' }), EnvStepStub({ kind: 'number' }), EnvStepStub({ kind: 'default', value: 0 })],
        }),
      ).toBe(false);
    });

    it('EMPTY: {steps: undefined} => false, since no environment read was recorded', () => {
      expect(isEnvStepsNullableGuard({})).toBe(false);
    });
  });
});
