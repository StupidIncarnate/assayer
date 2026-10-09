import { EnvStepStub } from '@assayer/shared/contracts/env-step/env-step.stub';

import { envStepsDomainTransformer } from './env-steps-domain-transformer';

describe('envStepsDomainTransformer', () => {
  describe('a chain that builds an array', () => {
    it('VALID: {split} => never null, and a length of at least 1', () => {
      expect(envStepsDomainTransformer({ steps: [EnvStepStub({ kind: 'split', separator: ',' })] })).toStrictEqual({
        minExclusive: false,
        maxExclusive: false,
        lengthMin: 1,
        lengthMinExclusive: false,
        lengthMaxExclusive: false,
        lengthExcluded: [],
        excluded: [null],
      });
    });

    it('VALID: {default, split, map} => a length of at least 1, since map keeps the length', () => {
      expect(
        envStepsDomainTransformer({
          steps: [EnvStepStub({ kind: 'default', value: '' }), EnvStepStub({ kind: 'split', separator: ',' }), EnvStepStub({ kind: 'map' })],
        }),
      ).toStrictEqual({
        minExclusive: false,
        maxExclusive: false,
        lengthMin: 1,
        lengthMinExclusive: false,
        lengthMaxExclusive: false,
        lengthExcluded: [],
        excluded: [null],
      });
    });
  });

  describe('a chain that builds a scalar', () => {
    it('VALID: {number} => never null, with no length limit', () => {
      expect(envStepsDomainTransformer({ steps: [EnvStepStub({ kind: 'number' })] })).toStrictEqual({
        minExclusive: false,
        maxExclusive: false,
        lengthMinExclusive: false,
        lengthMaxExclusive: false,
        lengthExcluded: [],
        excluded: [null],
      });
    });

    it('VALID: {default} => never null, since the fallback replaces an unset variable', () => {
      expect(envStepsDomainTransformer({ steps: [EnvStepStub({ kind: 'default', value: '' })] })).toStrictEqual({
        minExclusive: false,
        maxExclusive: false,
        lengthMinExclusive: false,
        lengthMaxExclusive: false,
        lengthExcluded: [],
        excluded: [null],
      });
    });
  });

  describe('the raw read', () => {
    it('EMPTY: {steps: []} => undefined, since the raw string limits nothing a case can set', () => {
      expect(envStepsDomainTransformer({ steps: [] })).toBe(undefined);
    });
  });
});
