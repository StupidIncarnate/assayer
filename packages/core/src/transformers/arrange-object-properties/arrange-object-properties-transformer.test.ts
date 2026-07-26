import { ConditionLeafStub, PropertyDemandStub, symbolNameContract, typeTextContract } from '@assayer/shared/contracts';

import { arrangeObjectPropertiesTransformer } from './arrange-object-properties-transformer';

const dbRetryEq3Leaf = ConditionLeafStub({
  operandPropertyPath: ['db', 'retry'],
  operandType: { kind: 'number' },
  predicate: { kind: 'eq', literal: 3 },
});

const dbTruthyLeaf = ConditionLeafStub({
  operandPropertyPath: ['db'],
  operandType: { kind: 'object', properties: [] },
  predicate: { kind: 'truthy' },
});

// The nested demand `db.retry` carries once both a THEN and an ELSE arm need it: the domain math over
// `retry === 3` yields exactly the satisfying [3] and the violating fallback [7].
const dbRetryDemand = PropertyDemandStub({
  name: 'db',
  demand: { kind: 'nested', properties: [PropertyDemandStub({ name: 'retry', demand: { kind: 'demanded', values: [3, 7] } })] },
});

describe('arrangeObjectPropertiesTransformer', () => {
  describe('an unconstrained property', () => {
    it('VALID: {mode: string, no requirement} => the seam fill', () => {
      const result = arrangeObjectPropertiesTransformer({
        properties: [{ name: symbolNameContract.parse('mode'), type: { kind: 'string' } }],
        demands: [],
        requirements: [],
        corrected: new Set(),
      });

      expect(result).toStrictEqual({ unreachable: false, unfillable: false, properties: [{ name: 'mode', value: 'abc123' }] });
    });
  });

  describe('a requirement two levels deep, onto a NAMED nested object property', () => {
    it('VALID: {db: {retry: number}, db.retry === 3, want true} => db built as { retry: 3 }', () => {
      const result = arrangeObjectPropertiesTransformer({
        properties: [
          {
            name: symbolNameContract.parse('db'),
            type: { kind: 'object', properties: [{ name: symbolNameContract.parse('retry'), type: { kind: 'number' } }] },
          },
        ],
        demands: [dbRetryDemand],
        requirements: [{ leaf: dbRetryEq3Leaf, want: true }],
        corrected: new Set(),
      });

      expect(result).toStrictEqual({ unreachable: false, unfillable: false, properties: [{ name: 'db', value: { retry: 3 } }] });
    });

    it('VALID: {db.retry === 3, want false} => db built as { retry: 7 }, the demanded non-3 value', () => {
      const result = arrangeObjectPropertiesTransformer({
        properties: [
          {
            name: symbolNameContract.parse('db'),
            type: { kind: 'object', properties: [{ name: symbolNameContract.parse('retry'), type: { kind: 'number' } }] },
          },
        ],
        demands: [dbRetryDemand],
        requirements: [{ leaf: dbRetryEq3Leaf, want: false }],
        corrected: new Set(),
      });

      expect(result).toStrictEqual({ unreachable: false, unfillable: false, properties: [{ name: 'db', value: { retry: 7 } }] });
    });
  });

  describe('a requirement three levels deep', () => {
    it('VALID: {db.retry.backoff === "x"} => the whole chain is built, unread siblings filled', () => {
      const backoffLeaf = ConditionLeafStub({
        operandPropertyPath: ['db', 'retry', 'backoff'],
        operandType: { kind: 'string' },
        predicate: { kind: 'eq', literal: 'x' },
      });
      const result = arrangeObjectPropertiesTransformer({
        properties: [
          {
            name: symbolNameContract.parse('db'),
            type: {
              kind: 'object',
              properties: [
                {
                  name: symbolNameContract.parse('retry'),
                  type: {
                    kind: 'object',
                    properties: [
                      { name: symbolNameContract.parse('backoff'), type: { kind: 'string' } },
                      { name: symbolNameContract.parse('max'), type: { kind: 'number' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
        demands: [],
        requirements: [{ leaf: backoffLeaf, want: true }],
        corrected: new Set(),
      });

      expect(result).toStrictEqual({
        unreachable: false,
        unfillable: false,
        properties: [{ name: 'db', value: { retry: { backoff: 'x', max: 7 } } }],
      });
    });
  });

  describe('a committed correction', () => {
    // A correction addresses the TOP level of the type it was written against — it is consulted only
    // at the level `arrangeObjectPropertiesTransformer` was called with one, never a level down.
    it('VALID: {mode corrected at the TOP level} => authoritative, exactly as the single-level case', () => {
      const modeEqALeaf = ConditionLeafStub({
        operandPropertyPath: ['mode'],
        operandType: { kind: 'string' },
        predicate: { kind: 'eq', literal: 'a' },
      });
      const result = arrangeObjectPropertiesTransformer({
        properties: [{ name: symbolNameContract.parse('mode'), type: { kind: 'string' } }],
        demands: [PropertyDemandStub({ name: 'mode', demand: { kind: 'demanded', values: ['a', 'dev'] } })],
        requirements: [{ leaf: modeEqALeaf, want: true }],
        corrected: new Set(['mode']),
      });

      expect(result).toStrictEqual({ unreachable: false, unfillable: false, properties: [{ name: 'mode', value: 'a' }] });
    });

    it('VALID: {a correction named for the OUTER property only} => the nested recursion still runs uncorrected', () => {
      const result = arrangeObjectPropertiesTransformer({
        properties: [
          {
            name: symbolNameContract.parse('db'),
            type: { kind: 'object', properties: [{ name: symbolNameContract.parse('retry'), type: { kind: 'number' } }] },
          },
        ],
        demands: [dbRetryDemand],
        requirements: [{ leaf: dbRetryEq3Leaf, want: true }],
        // A correction named 'retry' here would only ever apply if this call were arranging `Db`
        // itself — it does nothing at this level because it does not name 'db', the property this
        // level owns.
        corrected: new Set(['retry']),
      });

      expect(result).toStrictEqual({ unreachable: false, unfillable: false, properties: [{ name: 'db', value: { retry: 3 } }] });
    });
  });

  describe('a truthiness read alongside a deeper one', () => {
    it('VALID: {if (config.db && config.db.retry === 3), the true arm} => the built object satisfies the truthy read for free', () => {
      const result = arrangeObjectPropertiesTransformer({
        properties: [
          {
            name: symbolNameContract.parse('db'),
            type: { kind: 'object', properties: [{ name: symbolNameContract.parse('retry'), type: { kind: 'number' } }] },
          },
        ],
        demands: [],
        requirements: [
          { leaf: dbTruthyLeaf, want: true },
          { leaf: dbRetryEq3Leaf, want: true },
        ],
        corrected: new Set(),
      });

      expect(result).toStrictEqual({ unreachable: false, unfillable: false, properties: [{ name: 'db', value: { retry: 3 } }] });
    });

    it('INVALID: {a FALSY read of db alongside a deeper read of db.retry} => unreachable, no object can be both absent and read', () => {
      const result = arrangeObjectPropertiesTransformer({
        properties: [
          {
            name: symbolNameContract.parse('db'),
            type: { kind: 'object', properties: [{ name: symbolNameContract.parse('retry'), type: { kind: 'number' } }] },
          },
        ],
        demands: [],
        requirements: [
          { leaf: dbTruthyLeaf, want: false },
          { leaf: dbRetryEq3Leaf, want: true },
        ],
        corrected: new Set(),
      });

      expect(result.unreachable).toBe(true);
    });
  });

  describe('unreachable and unfillable propagation', () => {
    it('INVALID: {a contradiction two levels down} => unreachable propagates to the top', () => {
      const result = arrangeObjectPropertiesTransformer({
        properties: [
          {
            name: symbolNameContract.parse('db'),
            type: { kind: 'object', properties: [{ name: symbolNameContract.parse('retry'), type: { kind: 'number' } }] },
          },
        ],
        demands: [PropertyDemandStub({ name: 'db', demand: { kind: 'nested', properties: [PropertyDemandStub({ name: 'retry', demand: { kind: 'demanded', values: [3] } })] } })],
        requirements: [
          { leaf: dbRetryEq3Leaf, want: true },
          { leaf: dbRetryEq3Leaf, want: false },
        ],
        corrected: new Set(),
      });

      expect(result.unreachable).toBe(true);
    });

    // The requirement forces a recursion into `db`'s own shape (`db.retry === 3`), and `write`, `db`'s
    // OTHER property, is left unconstrained inside that recursion — its own fill seam refuses the
    // callable, and that hole has to propagate out through the recursive object build, not just across
    // sibling properties at one level.
    it('INVALID: {an unfillable SIBLING two levels down, reached only through recursion} => unfillable propagates, the hole is not filled', () => {
      const result = arrangeObjectPropertiesTransformer({
        properties: [
          {
            name: symbolNameContract.parse('db'),
            type: {
              kind: 'object',
              properties: [
                { name: symbolNameContract.parse('retry'), type: { kind: 'number' } },
                { name: symbolNameContract.parse('write'), type: { kind: 'callable', text: typeTextContract.parse('() => void') } },
              ],
            },
          },
        ],
        demands: [],
        requirements: [{ leaf: dbRetryEq3Leaf, want: true }],
        corrected: new Set(),
      });

      expect(result).toStrictEqual({ unreachable: false, unfillable: true, properties: [] });
    });
  });
});
