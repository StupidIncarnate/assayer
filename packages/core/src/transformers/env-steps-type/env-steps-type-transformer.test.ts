import { EnvStepStub } from '@assayer/shared/contracts/env-step/env-step.stub';

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

    it('VALID: {number, equals} => a boolean, the type of the last step', () => {
      expect(
        envStepsTypeTransformer({ steps: [EnvStepStub({ kind: 'number' }), EnvStepStub({ kind: 'equals', literal: 7, negated: true })] }),
      ).toStrictEqual({ kind: 'boolean' });
    });
  });
});
