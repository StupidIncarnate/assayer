import { envStepContract } from './env-step-contract';
import { EnvStepStub } from './env-step.stub';

describe('envStepContract', () => {
  describe('valid steps', () => {
    it('VALID: {stub default} => parses a split on a comma', () => {
      const step = EnvStepStub();

      const result = envStepContract.parse(step);

      expect(result).toStrictEqual({ kind: 'split', separator: ',' });
    });

    it('VALID: {kind: "default", value: ""} => parses an empty fallback string', () => {
      const result = envStepContract.parse({ kind: 'default', value: '' });

      expect(result).toStrictEqual({ kind: 'default', value: '' });
    });

    it('VALID: {kind: "number"} => parses the Number coercion', () => {
      const result = envStepContract.parse({ kind: 'number' });

      expect(result).toStrictEqual({ kind: 'number' });
    });

    it('VALID: {kind: "equals", literal: "true", negated: false} => parses a string comparison', () => {
      const result = envStepContract.parse({ kind: 'equals', literal: 'true', negated: false });

      expect(result).toStrictEqual({ kind: 'equals', literal: 'true', negated: false });
    });

    it('VALID: {kind: "equals", literal: 7, negated: true} => parses a negated number comparison', () => {
      const result = envStepContract.parse({ kind: 'equals', literal: 7, negated: true });

      expect(result).toStrictEqual({ kind: 'equals', literal: 7, negated: true });
    });

    it('VALID: {kind: "map"} => parses an element-wise map', () => {
      const result = envStepContract.parse({ kind: 'map' });

      expect(result).toStrictEqual({ kind: 'map' });
    });
  });

  describe('invalid steps', () => {
    it('INVALID: {kind: "split", separator: ""} => throws validation error', () => {
      expect(() => {
        return envStepContract.parse({ kind: 'split', separator: '' });
      }).toThrow(/Too small/u);
    });

    it('INVALID: {kind: "equals", literal: null} => throws validation error', () => {
      expect(() => {
        return envStepContract.parse({ kind: 'equals', literal: null, negated: false });
      }).toThrow(/Invalid input/u);
    });

    it('INVALID: {kind: "trim"} => throws validation error', () => {
      expect(() => {
        return envStepContract.parse({ kind: 'trim' });
      }).toThrow(/Invalid discriminator value/u);
    });
  });
});
