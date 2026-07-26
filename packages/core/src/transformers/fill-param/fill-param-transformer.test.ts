import { ParamDescriptorStub } from '@assayer/shared/contracts';

import { fillParamTransformer } from './fill-param-transformer';

describe('fillParamTransformer', () => {
  describe('a scalar parameter', () => {
    it('VALID: {a string param} => its scalar representative, a param binding', () => {
      const result = fillParamTransformer({ param: ParamDescriptorStub({ name: 'name', type: { kind: 'string' } }) });

      expect(result).toStrictEqual({ kind: 'filled', binding: { kind: 'param', param: 'name', value: 'abc123' } });
    });

    it('VALID: {a number param} => its scalar representative', () => {
      const result = fillParamTransformer({ param: ParamDescriptorStub({ name: 'count', type: { kind: 'number' } }) });

      expect(result).toStrictEqual({ kind: 'filled', binding: { kind: 'param', param: 'count', value: 7 } });
    });
  });

  describe('an array parameter', () => {
    // The whole reason this exists: a scalar fill would hand `items.map(...)` a string and throw. An
    // unsteered array param must be a REAL array of the `one` cardinality.
    it('VALID: {a number[] param} => a real one-element array, an array binding', () => {
      const result = fillParamTransformer({
        param: ParamDescriptorStub({ name: 'ys', type: { kind: 'array', element: { kind: 'number' } } }),
      });

      expect(result).toStrictEqual({ kind: 'filled', binding: { kind: 'array', param: 'ys', value: [7] } });
    });

    it('VALID: {a nested number[][] param} => a real nested array', () => {
      const result = fillParamTransformer({
        param: ParamDescriptorStub({ name: 'grid', type: { kind: 'array', element: { kind: 'array', element: { kind: 'number' } } } }),
      });

      expect(result).toStrictEqual({ kind: 'filled', binding: { kind: 'array', param: 'grid', value: [[7]] } });
    });

    // A5: the interpreter applies an `array` binding as ONE positional argument UNLESS it is marked
    // `rest` — a rest parameter's array must SPREAD across the tail positional slots it stands for, so
    // the binding this seam builds for one must carry the fact, mirroring the descriptor's own flag.
    it('VALID: {a rest number[] param} => the array binding carries rest: true', () => {
      const result = fillParamTransformer({
        param: ParamDescriptorStub({ name: 'ns', type: { kind: 'array', element: { kind: 'number' } }, rest: true }),
      });

      expect(result).toStrictEqual({ kind: 'filled', binding: { kind: 'array', param: 'ns', value: [7], rest: true } });
    });
  });

  describe('an object parameter', () => {
    // The shape is KNOWN — the reader enumerated it — so the fill builds it rather than discarding it.
    it('VALID: {a nested object param} => a real object binding, nested all the way down', () => {
      const result = fillParamTransformer({
        param: ParamDescriptorStub({
          name: 'config',
          type: {
            kind: 'object',
            typeName: 'Config',
            properties: [
              { name: 'db', type: { kind: 'object', typeName: 'Db', properties: [{ name: 'host', type: { kind: 'string' } }] } },
              { name: 'mode', type: { kind: 'string' } },
            ],
          },
        }),
      });

      expect(result).toStrictEqual({
        kind: 'filled',
        binding: { kind: 'object', param: 'config', value: { db: { host: 'abc123' }, mode: 'abc123' } },
      });
    });

    it('EMPTY: {a property-less object param} => the empty object, which satisfies it completely', () => {
      const result = fillParamTransformer({
        param: ParamDescriptorStub({ name: 'e', type: { kind: 'object', typeName: 'Empty', properties: [] } }),
      });

      expect(result).toStrictEqual({ kind: 'filled', binding: { kind: 'object', param: 'e', value: {} } });
    });
  });

  // The refusal. A placeholder here is worse than nothing twice over: `report('over')` throws on a
  // string, and `payload.size` quietly reads 6 and PASSES against an input the code never had.
  describe('a parameter no value of the right shape exists for', () => {
    it('INVALID: {a callback param} => unfillable, naming the param and its declared type', () => {
      const result = fillParamTransformer({
        param: ParamDescriptorStub({ name: 'report', type: { kind: 'callable', text: '(m: string) => string' } }),
      });

      expect(result).toStrictEqual({ kind: 'unfillable', param: 'report', type: '(m: string) => string' });
    });

    it('INVALID: {an opaque Map param} => unfillable, naming the type text the reader carried', () => {
      const result = fillParamTransformer({
        param: ParamDescriptorStub({ name: 'payload', type: { kind: 'unknown', text: 'Map<string, number>' } }),
      });

      expect(result).toStrictEqual({ kind: 'unfillable', param: 'payload', type: 'Map<string, number>' });
    });

    it('INVALID: {an object param with a callable member} => unfillable, named by the type', () => {
      const result = fillParamTransformer({
        param: ParamDescriptorStub({
          name: 'sink',
          type: {
            kind: 'object',
            typeName: 'Sink',
            properties: [{ name: 'write', type: { kind: 'callable', text: '(line: string) => string' } }],
          },
        }),
      });

      expect(result).toStrictEqual({ kind: 'unfillable', param: 'sink', type: 'Sink' });
    });

    // A self-referential shape: the reader stopped at the inner `Tree` and MARKED it, so the empty
    // property list is a truncation. `{ label, next: {} }` would hand `Tree` a `next` missing `label`.
    it('INVALID: {a self-referential object param} => unfillable, named by the type', () => {
      const result = fillParamTransformer({
        param: ParamDescriptorStub({
          name: 'tree',
          type: {
            kind: 'object',
            typeName: 'Tree',
            properties: [
              { name: 'label', type: { kind: 'string' } },
              { name: 'next', type: { kind: 'object', typeName: 'Tree', truncated: true, properties: [] } },
            ],
          },
        }),
      });

      expect(result).toStrictEqual({ kind: 'unfillable', param: 'tree', type: 'Tree' });
    });

    it('INVALID: {an array of callbacks} => unfillable, named by the element type', () => {
      const result = fillParamTransformer({
        param: ParamDescriptorStub({
          name: 'hooks',
          type: { kind: 'array', element: { kind: 'callable', text: '() => void' } },
        }),
      });

      expect(result).toStrictEqual({ kind: 'unfillable', param: 'hooks', type: '() => void[]' });
    });

    // A tuple enumerates as an anonymous object carrying every ReadonlyArray member — rendering the
    // descriptor buries the one actionable fact. `declaredText` is what the SOURCE spelled, and it wins
    // over the descriptor's own rendering whenever the two differ.
    it('INVALID: {a param whose declaredText differs from the descriptor rendering} => unfillable, named by declaredText', () => {
      const result = fillParamTransformer({
        param: ParamDescriptorStub({
          name: 'pair',
          type: { kind: 'unknown', text: 'ReadonlyArray<string | number>' },
          declaredText: 'readonly [string, number]',
        }),
      });

      expect(result).toStrictEqual({ kind: 'unfillable', param: 'pair', type: 'readonly [string, number]' });
    });
  });
});
