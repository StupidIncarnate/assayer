import { symbolNameContract } from '@assayer/shared/contracts';
import { ConditionLeafStub } from '@assayer/shared/contracts/condition-leaf/condition-leaf.stub';

import { demandsForPropertiesTransformer } from './demands-for-properties-transformer';

describe('demandsForPropertiesTransformer', () => {
  describe('a one-segment path', () => {
    it("VALID: {mode: string, config.mode === 'a'} => mode demanded ['a', 'abc123']", () => {
      const result = demandsForPropertiesTransformer({
        properties: [{ name: symbolNameContract.parse('mode'), type: { kind: 'string' } }],
        leaves: [
          ConditionLeafStub({
            operandPropertyPath: ['mode'],
            operandType: { kind: 'string' },
            predicate: { kind: 'eq', literal: 'a' },
          }),
        ],
      });

      expect(result).toStrictEqual([{ name: 'mode', demand: { kind: 'demanded', values: ['a', 'abc123'] } }]);
    });

    it('EMPTY: {a property no leaf reaches} => unknown', () => {
      const result = demandsForPropertiesTransformer({
        properties: [{ name: symbolNameContract.parse('mode'), type: { kind: 'string' } }],
        leaves: [],
      });

      expect(result).toStrictEqual([{ name: 'mode', demand: { kind: 'unknown' } }]);
    });
  });

  describe('a multi-segment path onto an object-typed property', () => {
    it("VALID: {db: {retry: number}, path ['db','retry']} => db is NESTED, retry demanded [3, 7]", () => {
      const result = demandsForPropertiesTransformer({
        properties: [
          {
            name: symbolNameContract.parse('db'),
            type: { kind: 'object', properties: [{ name: symbolNameContract.parse('retry'), type: { kind: 'number' } }] },
          },
        ],
        leaves: [
          ConditionLeafStub({
            operandPropertyPath: ['db', 'retry'],
            operandType: { kind: 'number' },
            predicate: { kind: 'eq', literal: 3 },
          }),
        ],
      });

      expect(result).toStrictEqual([
        { name: 'db', demand: { kind: 'nested', properties: [{ name: 'retry', demand: { kind: 'demanded', values: [3, 7] } }] } },
      ]);
    });

    it('VALID: {a three-level path} => the nested tree recurses again for its own nested property', () => {
      const result = demandsForPropertiesTransformer({
        properties: [
          {
            name: symbolNameContract.parse('db'),
            type: {
              kind: 'object',
              properties: [
                {
                  name: symbolNameContract.parse('retry'),
                  type: { kind: 'object', properties: [{ name: symbolNameContract.parse('backoff'), type: { kind: 'number' } }] },
                },
              ],
            },
          },
        ],
        leaves: [
          ConditionLeafStub({
            operandPropertyPath: ['db', 'retry', 'backoff'],
            operandType: { kind: 'number' },
            predicate: { kind: 'gt', literal: 5 },
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
                demand: { kind: 'nested', properties: [{ name: 'backoff', demand: { kind: 'demanded', values: [5, 6] } }] },
              },
            ],
          },
        },
      ]);
    });

    // A property's type must be an OBJECT to be walked past — a scalar has nowhere for the path to
    // continue into, so a leaf naming a deeper segment off one is simply unmatched, the same as any
    // read naming a property the type does not declare.
    it("EDGE: {mode: string, path ['mode','sub']} => mode stays unknown, the path cannot continue into a scalar", () => {
      const result = demandsForPropertiesTransformer({
        properties: [{ name: symbolNameContract.parse('mode'), type: { kind: 'string' } }],
        leaves: [
          ConditionLeafStub({
            operandPropertyPath: ['mode', 'sub'],
            operandType: { kind: 'string' },
            predicate: { kind: 'eq', literal: 'a' },
          }),
        ],
      });

      expect(result).toStrictEqual([{ name: 'mode', demand: { kind: 'unknown' } }]);
    });
  });

  describe('property ordering', () => {
    it('VALID: {properties declared out of order} => returned sorted alphabetically', () => {
      const result = demandsForPropertiesTransformer({
        properties: [
          { name: symbolNameContract.parse('retries'), type: { kind: 'number' } },
          { name: symbolNameContract.parse('mode'), type: { kind: 'string' } },
        ],
        leaves: [],
      });

      expect(result).toStrictEqual([
        { name: 'mode', demand: { kind: 'unknown' } },
        { name: 'retries', demand: { kind: 'unknown' } },
      ]);
    });
  });
});
