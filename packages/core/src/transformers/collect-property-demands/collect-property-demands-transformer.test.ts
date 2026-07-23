import { ConditionLeafStub, DeclaredTypeStub } from '@assayer/shared/contracts';

import { collectPropertyDemandsTransformer } from './collect-property-demands-transformer';

describe('collectPropertyDemandsTransformer', () => {
  describe('a property the code branches on', () => {
    it("VALID: {Config{mode,retries}, config.mode === 'a'} => mode demanded ['a','abc123'], retries unknown", () => {
      const result = collectPropertyDemandsTransformer({
        declaredType: DeclaredTypeStub(),
        leaves: [
          ConditionLeafStub({
            operandParamName: 'config',
            operandPropertyPath: ['mode'],
            operandTypeRef: 'Config',
            operandType: { kind: 'string' },
            predicate: { kind: 'eq', literal: 'a' },
          }),
        ],
      });

      expect(result).toStrictEqual([
        { name: 'mode', demand: { kind: 'demanded', values: ['a', 'abc123'] } },
        { name: 'retries', demand: { kind: 'unknown' } },
      ]);
    });

    it('VALID: {Limits{count:number}, l.count > 5} => count demanded [5, 6] (the two boundary reps)', () => {
      const result = collectPropertyDemandsTransformer({
        declaredType: DeclaredTypeStub({ name: 'Limits', properties: [{ name: 'count', type: { kind: 'number' } }] }),
        leaves: [
          ConditionLeafStub({
            operandParamName: 'l',
            operandPropertyPath: ['count'],
            operandTypeRef: 'Limits',
            operandType: { kind: 'number' },
            predicate: { kind: 'gt', literal: 5 },
          }),
        ],
      });

      expect(result).toStrictEqual([{ name: 'count', demand: { kind: 'demanded', values: [5, 6] } }]);
    });

    it("VALID: {Mode{kind: 'a'|'b'|'c'}, m.kind === 'a'} => kind demanded ['a','b','c'] (exhaustive over the union)", () => {
      const result = collectPropertyDemandsTransformer({
        declaredType: DeclaredTypeStub({
          name: 'Mode',
          properties: [
            {
              name: 'kind',
              type: {
                kind: 'union',
                members: [
                  { kind: 'literal', value: 'a' },
                  { kind: 'literal', value: 'b' },
                  { kind: 'literal', value: 'c' },
                ],
              },
            },
          ],
        }),
        leaves: [
          ConditionLeafStub({
            operandParamName: 'm',
            operandPropertyPath: ['kind'],
            operandTypeRef: 'Mode',
            operandType: {
              kind: 'union',
              members: [
                { kind: 'literal', value: 'a' },
                { kind: 'literal', value: 'b' },
                { kind: 'literal', value: 'c' },
              ],
            },
            predicate: { kind: 'eq', literal: 'a' },
          }),
        ],
      });

      expect(result).toStrictEqual([{ name: 'kind', demand: { kind: 'demanded', values: ['a', 'b', 'c'] } }]);
    });
  });

  describe('a property no read fact reaches', () => {
    it('EMPTY: {no leaves} => every property is an unknown demand', () => {
      const result = collectPropertyDemandsTransformer({ declaredType: DeclaredTypeStub(), leaves: [] });

      expect(result).toStrictEqual([
        { name: 'mode', demand: { kind: 'unknown' } },
        { name: 'retries', demand: { kind: 'unknown' } },
      ]);
    });

    it('EDGE: {a nested read config.mode.sub} => the top property stays unknown (a nested demand needs the sub-type)', () => {
      const result = collectPropertyDemandsTransformer({
        declaredType: DeclaredTypeStub(),
        leaves: [
          ConditionLeafStub({
            operandParamName: 'config',
            operandPropertyPath: ['mode', 'sub'],
            operandTypeRef: 'Config',
            operandType: { kind: 'string' },
            predicate: { kind: 'eq', literal: 'a' },
          }),
        ],
      });

      expect(result).toStrictEqual([
        { name: 'mode', demand: { kind: 'unknown' } },
        { name: 'retries', demand: { kind: 'unknown' } },
      ]);
    });

    it('EDGE: {a read whose type-ref names a different type} => this type is untouched (all unknown)', () => {
      const result = collectPropertyDemandsTransformer({
        declaredType: DeclaredTypeStub(),
        leaves: [
          ConditionLeafStub({
            operandParamName: 'other',
            operandPropertyPath: ['mode'],
            operandTypeRef: 'Other',
            operandType: { kind: 'string' },
            predicate: { kind: 'eq', literal: 'a' },
          }),
        ],
      });

      expect(result).toStrictEqual([
        { name: 'mode', demand: { kind: 'unknown' } },
        { name: 'retries', demand: { kind: 'unknown' } },
      ]);
    });
  });
});
