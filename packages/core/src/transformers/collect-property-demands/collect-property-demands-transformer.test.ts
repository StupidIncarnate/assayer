import { ConditionLeafStub } from '@assayer/shared/contracts/condition-leaf/condition-leaf.stub';
import { DeclaredTypeStub } from '@assayer/shared/contracts/declared-type/declared-type.stub';

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

    // The cross-file shape: an imported object types as `any` at the leaf, so the leaf's own operand
    // type names nothing and only the DECLARED property type carries the domain. Reading the leaf here
    // would silently narrow the demand to the branch literal alone — the same branch, a different
    // answer, decided by which file declares the type.
    it("VALID: {Config{mode}, config.mode === 'a' whose leaf operand is an opaque cross-file any} => mode demanded ['a','abc123'], identical to the same-file read", () => {
      const result = collectPropertyDemandsTransformer({
        declaredType: DeclaredTypeStub(),
        leaves: [
          ConditionLeafStub({
            operandParamName: 'config',
            operandPropertyPath: ['mode'],
            operandTypeRef: 'Config',
            operandType: { kind: 'unknown', text: 'any' },
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

    it("VALID: {Config{mode}, two leaves reading mode with different literals ('a' then 'b')} => mode demanded the deduped union of both leaves' values", () => {
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
          ConditionLeafStub({
            operandParamName: 'config',
            operandPropertyPath: ['mode'],
            operandTypeRef: 'Config',
            operandType: { kind: 'string' },
            predicate: { kind: 'eq', literal: 'b' },
          }),
        ],
      });

      expect(result).toStrictEqual([
        { name: 'mode', demand: { kind: 'demanded', values: ['a', 'abc123', 'b'] } },
        { name: 'retries', demand: { kind: 'unknown' } },
      ]);
    });
  });

  describe('a property whose read fact matches but realizes no value', () => {
    // Every reader of `handler` compares it with a predicate that carries no literal (`truthy`), and
    // `handler` is a callable — no scalar of that type exists to fall back on (representativeValueTransformer
    // refuses callables). Both arms realize to nothing, so the match must not produce a `demanded` demand
    // with an empty values array — that would read as a real demand with nothing in it.
    it('EDGE: {Config{handler: callable}, handler is truthy} => handler stays unknown, not a demanded with empty values', () => {
      const result = collectPropertyDemandsTransformer({
        declaredType: DeclaredTypeStub({
          name: 'Config',
          properties: [{ name: 'handler', type: { kind: 'callable', text: '() => void' } }],
        }),
        leaves: [
          ConditionLeafStub({
            operandParamName: 'config',
            operandPropertyPath: ['handler'],
            operandTypeRef: 'Config',
            operandType: { kind: 'unknown', text: 'any' },
            predicate: { kind: 'truthy' },
          }),
        ],
      });

      expect(result).toStrictEqual([{ name: 'handler', demand: { kind: 'unknown' } }]);
    });
  });

  describe('a property no read fact reaches', () => {
    it('EDGE: {a leaf with no object-member read (a plain scalar-param leaf)} => every property stays unknown', () => {
      const result = collectPropertyDemandsTransformer({
        declaredType: DeclaredTypeStub(),
        leaves: [ConditionLeafStub()],
      });

      expect(result).toStrictEqual([
        { name: 'mode', demand: { kind: 'unknown' } },
        { name: 'retries', demand: { kind: 'unknown' } },
      ]);
    });

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

  describe('a property whose own type is an object, read past itself', () => {
    it("VALID: {Config{db:{retry:number}}, config.db.retry === 3} => db demanded NESTED, retry demanded [3, 7]", () => {
      const result = collectPropertyDemandsTransformer({
        declaredType: DeclaredTypeStub({
          name: 'Config',
          properties: [{ name: 'db', type: { kind: 'object', properties: [{ name: 'retry', type: { kind: 'number' } }] } }],
        }),
        leaves: [
          ConditionLeafStub({
            operandParamName: 'config',
            operandPropertyPath: ['db', 'retry'],
            operandTypeRef: 'Config',
            operandType: { kind: 'number' },
            predicate: { kind: 'eq', literal: 3 },
          }),
        ],
      });

      expect(result).toStrictEqual([
        { name: 'db', demand: { kind: 'nested', properties: [{ name: 'retry', demand: { kind: 'demanded', values: [3, 7] } }] } },
      ]);
    });

    it("VALID: {Config{db:{retry:{backoff:string}}}, config.db.retry.backoff === 'x'} => the nested tree walks three levels deep", () => {
      const result = collectPropertyDemandsTransformer({
        declaredType: DeclaredTypeStub({
          name: 'Config',
          properties: [
            {
              name: 'db',
              type: {
                kind: 'object',
                properties: [
                  { name: 'retry', type: { kind: 'object', properties: [{ name: 'backoff', type: { kind: 'string' } }] } },
                ],
              },
            },
          ],
        }),
        leaves: [
          ConditionLeafStub({
            operandParamName: 'config',
            operandPropertyPath: ['db', 'retry', 'backoff'],
            operandTypeRef: 'Config',
            operandType: { kind: 'string' },
            predicate: { kind: 'eq', literal: 'x' },
          }),
        ],
      });

      expect(result).toStrictEqual([
        {
          name: 'db',
          demand: {
            kind: 'nested',
            properties: [
              {
                name: 'retry',
                demand: { kind: 'nested', properties: [{ name: 'backoff', demand: { kind: 'demanded', values: ['abc123', 'x'] } }] },
              },
            ],
          },
        },
      ]);
    });

    it('VALID: {a sibling property beside the nested one} => the sibling is unaffected and still sorts alphabetically', () => {
      const result = collectPropertyDemandsTransformer({
        declaredType: DeclaredTypeStub({
          name: 'Config',
          properties: [
            { name: 'db', type: { kind: 'object', properties: [{ name: 'retry', type: { kind: 'number' } }] } },
            { name: 'mode', type: { kind: 'string' } },
          ],
        }),
        leaves: [
          ConditionLeafStub({
            operandParamName: 'config',
            operandPropertyPath: ['db', 'retry'],
            operandTypeRef: 'Config',
            operandType: { kind: 'number' },
            predicate: { kind: 'eq', literal: 3 },
          }),
        ],
      });

      expect(result).toStrictEqual([
        { name: 'db', demand: { kind: 'nested', properties: [{ name: 'retry', demand: { kind: 'demanded', values: [3, 7] } }] } },
        { name: 'mode', demand: { kind: 'unknown' } },
      ]);
    });
  });

  describe('property ordering', () => {
    it("VALID: {Config{retries,mode} declared out of alphabetical order} => properties returned sorted 'mode' before 'retries'", () => {
      const result = collectPropertyDemandsTransformer({
        declaredType: DeclaredTypeStub({
          name: 'Config',
          properties: [
            { name: 'retries', type: { kind: 'number' } },
            { name: 'mode', type: { kind: 'string' } },
          ],
        }),
        leaves: [],
      });

      expect(result).toStrictEqual([
        { name: 'mode', demand: { kind: 'unknown' } },
        { name: 'retries', demand: { kind: 'unknown' } },
      ]);
    });
  });
});
