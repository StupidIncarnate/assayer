import { RepresentativeValueStub } from '@assayer/shared/contracts';

import { literalTokenTransformer } from './literal-token-transformer';

describe('literalTokenTransformer', () => {
  describe('string literals', () => {
    it('VALID: {value: "get"} => str-prefixed token', () => {
      expect(literalTokenTransformer({ value: RepresentativeValueStub({ value: 'get' }) })).toBe('str:get');
    });
  });

  describe('numeric literals', () => {
    it('VALID: {value: 0} => num-prefixed token', () => {
      expect(literalTokenTransformer({ value: RepresentativeValueStub({ value: 0 }) })).toBe('num:0');
    });

    it('VALID: {value: 5} => num-prefixed token', () => {
      expect(literalTokenTransformer({ value: RepresentativeValueStub({ value: 5 }) })).toBe('num:5');
    });
  });
});
