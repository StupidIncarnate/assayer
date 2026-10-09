import { EnvStepStub } from '@assayer/shared/contracts/env-step/env-step.stub';

import { envOperandKeyTransformer } from './env-operand-key-transformer';

describe('envOperandKeyTransformer', () => {
  describe('the raw read', () => {
    it('EMPTY: {steps: []} => the read itself', () => {
      expect(envOperandKeyTransformer({ name: 'MODE', steps: [] })).toBe('process.env.MODE');
    });
  });

  describe('one step at a time', () => {
    it('VALID: {number} => the Number call', () => {
      expect(envOperandKeyTransformer({ name: 'VALUE', steps: [EnvStepStub({ kind: 'number' })] })).toBe('Number(process.env.VALUE)');
    });

    it("VALID: {default ''} => the fallback in parentheses", () => {
      expect(envOperandKeyTransformer({ name: 'R', steps: [EnvStepStub({ kind: 'default', value: '' })] })).toBe('(process.env.R ?? "")');
    });

    it("VALID: {equals 'true'} => the strict comparison", () => {
      expect(
        envOperandKeyTransformer({ name: 'FLAG', steps: [EnvStepStub({ kind: 'equals', literal: 'true', negated: false })] }),
      ).toBe('process.env.FLAG === "true"');
    });

    it("VALID: {negated equals 'off'} => the strict inequality", () => {
      expect(
        envOperandKeyTransformer({ name: 'FLAG', steps: [EnvStepStub({ kind: 'equals', literal: 'off', negated: true })] }),
      ).toBe('process.env.FLAG !== "off"');
    });
  });

  describe('a chain of steps', () => {
    it("VALID: {default '', split ',', map} => each step applied in order", () => {
      expect(
        envOperandKeyTransformer({
          name: 'R',
          steps: [EnvStepStub({ kind: 'default', value: '' }), EnvStepStub({ kind: 'split', separator: ',' }), EnvStepStub({ kind: 'map' })],
        }),
      ).toBe('(process.env.R ?? "").split(",").map(…)');
    });

    it('VALID: {guard, number} => the ternary that keeps an unset variable undefined', () => {
      expect(
        envOperandKeyTransformer({ name: 'V', steps: [EnvStepStub({ kind: 'guard' }), EnvStepStub({ kind: 'number' })] }),
      ).toBe('(process.env.V === undefined ? undefined : Number(process.env.V))');
    });

    it('VALID: {guard, number, default 0} => the fallback applied to the ternary', () => {
      expect(
        envOperandKeyTransformer({
          name: 'V',
          steps: [EnvStepStub({ kind: 'guard' }), EnvStepStub({ kind: 'number' }), EnvStepStub({ kind: 'default', value: 0 })],
        }),
      ).toBe('((process.env.V === undefined ? undefined : Number(process.env.V)) ?? 0)');
    });
  });
});
