import { EnvStepStub } from '@assayer/shared/contracts/env-step/env-step.stub';

import { ExternalOperandReadoutStub } from '../../contracts/external-operand-readout/external-operand-readout.stub';
import { envStepsTypeTransformer } from './env-steps-type-transformer';

describe('envStepsTypeTransformer', () => {
  describe('one step at a time', () => {
    it('EMPTY: {steps: []} => the raw read is a string', () => {
      expect(envStepsTypeTransformer({ steps: [] })).toStrictEqual({ kind: 'string' });
    });

    it('VALID: {default} => still a string, since a fallback only replaces an unset variable', () => {
      expect(envStepsTypeTransformer({ steps: [EnvStepStub({ kind: 'default', value: '' })] })).toStrictEqual({ kind: 'string' });
    });

    it('VALID: {number} => a number', () => {
      expect(envStepsTypeTransformer({ steps: [EnvStepStub({ kind: 'number' })] })).toStrictEqual({ kind: 'number' });
    });

    it('VALID: {equals} => a boolean', () => {
      expect(envStepsTypeTransformer({ steps: [EnvStepStub({ kind: 'equals', literal: 'true', negated: false })] })).toStrictEqual({
        kind: 'boolean',
      });
    });

    it('VALID: {split} => an array of strings', () => {
      expect(envStepsTypeTransformer({ steps: [EnvStepStub({ kind: 'split', separator: ',' })] })).toStrictEqual({
        kind: 'array',
        element: { kind: 'string' },
      });
    });
  });

  describe('a chain of steps', () => {
    it('VALID: {default, split, map} => an array whose elements the steps do not describe', () => {
      expect(
        envStepsTypeTransformer({
          steps: [EnvStepStub({ kind: 'default', value: '' }), EnvStepStub({ kind: 'split', separator: ',' }), EnvStepStub({ kind: 'map' })],
        }),
      ).toStrictEqual({ kind: 'array', element: { kind: 'unknown', text: 'unknown' } });
    });

    it('VALID: {guard, number} => number or undefined, since the guard keeps an unset variable undefined', () => {
      expect(envStepsTypeTransformer({ steps: [EnvStepStub({ kind: 'guard' }), EnvStepStub({ kind: 'number' })] })).toStrictEqual({
        kind: 'union',
        members: [{ kind: 'unknown', text: 'undefined' }, { kind: 'number' }],
      });
    });

    it("VALID: {guard, equals 'true'} => boolean or undefined", () => {
      expect(
        envStepsTypeTransformer({
          steps: [EnvStepStub({ kind: 'guard' }), EnvStepStub({ kind: 'equals', literal: 'true', negated: false })],
        }),
      ).toStrictEqual({ kind: 'union', members: [{ kind: 'unknown', text: 'undefined' }, { kind: 'boolean' }] });
    });

    it('VALID: {guard, number, default 0} => a number, since the fallback replaces undefined', () => {
      expect(
        envStepsTypeTransformer({
          steps: [EnvStepStub({ kind: 'guard' }), EnvStepStub({ kind: 'number' }), EnvStepStub({ kind: 'default', value: 0 })],
        }),
      ).toStrictEqual({ kind: 'number' });
    });

    it('VALID: {number, equals} => a boolean, the type of the last step', () => {
      expect(
        envStepsTypeTransformer({ steps: [EnvStepStub({ kind: 'number' }), EnvStepStub({ kind: 'equals', literal: 7, negated: true })] }),
      ).toStrictEqual({ kind: 'boolean' });
    });
  });

  describe('a command-line read', () => {
    it('VALID: {root: argv tail, steps: []} => a string array, never undefined', () => {
      const { root } = ExternalOperandReadoutStub({ root: { kind: 'argv', shape: 'tail', index: 2 } });

      expect(envStepsTypeTransformer({ steps: [], root })).toStrictEqual({ kind: 'array', element: { kind: 'string' } });
    });

    it('VALID: {root: argv element, steps: []} => a string, the same as an environment read', () => {
      const { root } = ExternalOperandReadoutStub({ root: { kind: 'argv', shape: 'element', index: 2 } });

      expect(envStepsTypeTransformer({ steps: [], root })).toStrictEqual({ kind: 'string' });
    });
  });
});
