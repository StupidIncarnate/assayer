import { ParamDescriptorStub } from '@assayer/shared/contracts';

import { fillParamTransformer } from './fill-param-transformer';

describe('fillParamTransformer', () => {
  describe('a scalar parameter', () => {
    it('VALID: {a string param} => its scalar representative, a param binding', () => {
      const result = fillParamTransformer({ param: ParamDescriptorStub({ name: 'name', type: { kind: 'string' } }) });

      expect(result).toStrictEqual({ kind: 'param', param: 'name', value: 'abc123' });
    });

    it('VALID: {a number param} => its scalar representative', () => {
      const result = fillParamTransformer({ param: ParamDescriptorStub({ name: 'count', type: { kind: 'number' } }) });

      expect(result).toStrictEqual({ kind: 'param', param: 'count', value: 7 });
    });
  });

  describe('an array parameter', () => {
    // The whole reason this exists: a scalar fill would hand `items.map(...)` a string and throw. An
    // unsteered array param must be a REAL array of the `one` cardinality.
    it('VALID: {a number[] param} => a real one-element array, an array binding', () => {
      const result = fillParamTransformer({
        param: ParamDescriptorStub({ name: 'ys', type: { kind: 'array', element: { kind: 'number' } } }),
      });

      expect(result).toStrictEqual({ kind: 'array', param: 'ys', value: [7] });
    });

    it('VALID: {a nested number[][] param} => a real nested array', () => {
      const result = fillParamTransformer({
        param: ParamDescriptorStub({ name: 'grid', type: { kind: 'array', element: { kind: 'array', element: { kind: 'number' } } } }),
      });

      expect(result).toStrictEqual({ kind: 'array', param: 'grid', value: [[7]] });
    });
  });
});
