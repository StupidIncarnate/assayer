import { arrangeBindingContract } from '@assayer/shared/contracts';

import { isValueBindingGuard } from './is-value-binding-guard';

describe('isValueBindingGuard', () => {
  describe('a binding keyed by its param', () => {
    it('VALID: {kind: param} => true', () => {
      expect(
        isValueBindingGuard({ binding: arrangeBindingContract.parse({ kind: 'param', param: 'name', value: 'abc123' }) }),
      ).toBe(true);
    });

    it('VALID: {kind: array} => true', () => {
      expect(
        isValueBindingGuard({ binding: arrangeBindingContract.parse({ kind: 'array', param: 'items', value: [7] }) }),
      ).toBe(true);
    });

    it('VALID: {kind: object} => true', () => {
      expect(
        isValueBindingGuard({
          binding: arrangeBindingContract.parse({ kind: 'object', param: 'config', value: { host: 'localhost' } }),
        }),
      ).toBe(true);
    });
  });

  describe('a binding keyed by something other than a param value', () => {
    it('INVALID: {kind: env} => false', () => {
      expect(
        isValueBindingGuard({ binding: arrangeBindingContract.parse({ kind: 'env', name: 'MODE', value: '6' }) }),
      ).toBe(false);
    });

    it('INVALID: {kind: harness} => false', () => {
      expect(
        isValueBindingGuard({
          binding: arrangeBindingContract.parse({ kind: 'harness', param: 'sink', key: 'inputs.run.sink' }),
        }),
      ).toBe(false);
    });
  });

  describe('a missing binding', () => {
    it('EMPTY: {no binding} => false', () => {
      expect(isValueBindingGuard({})).toBe(false);
    });
  });
});
