import { conditionLeafContract } from './condition-leaf-contract';
import { ConditionLeafStub } from './condition-leaf.stub';

describe('conditionLeafContract', () => {
  describe('valid leaves', () => {
    it('VALID: {a param operand with a gt predicate} => parses the leaf whole', () => {
      const leaf = ConditionLeafStub();

      const result = conditionLeafContract.parse(leaf);

      expect(result).toStrictEqual({
        kind: 'leaf',
        id: 'stub/if:BinaryExpression,id:value,GreaterThanToken,num:5#leaf',
        operandParamName: 'value',
        operandType: { kind: 'number' },
        predicate: { kind: 'gt', literal: 5 },
      });
    });

    it('VALID: {operand that is not a simple binding} => parses without an operandParamName', () => {
      const result = conditionLeafContract.parse({
        kind: 'leaf',
        id: 'stub/if:CallExpression,id:isReady#leaf',
        operandType: { kind: 'boolean' },
        predicate: { kind: 'truthy' },
      });

      expect(result).toStrictEqual({
        kind: 'leaf',
        id: 'stub/if:CallExpression,id:isReady#leaf',
        operandType: { kind: 'boolean' },
        predicate: { kind: 'truthy' },
      });
    });

    it('VALID: {an object-member operand} => carries the property path and root type-reference name', () => {
      const result = conditionLeafContract.parse({
        kind: 'leaf',
        id: 'stub/if:BinaryExpression,PropertyAccessExpression,id:config,id:mode,EqualsEqualsEqualsToken,str:a#leaf',
        operandParamName: 'config',
        operandPropertyPath: ['mode'],
        operandTypeRef: 'Config',
        operandType: { kind: 'string' },
        predicate: { kind: 'eq', literal: 'a' },
      });

      expect(result).toStrictEqual({
        kind: 'leaf',
        id: 'stub/if:BinaryExpression,PropertyAccessExpression,id:config,id:mode,EqualsEqualsEqualsToken,str:a#leaf',
        operandParamName: 'config',
        operandPropertyPath: ['mode'],
        operandTypeRef: 'Config',
        operandType: { kind: 'string' },
        predicate: { kind: 'eq', literal: 'a' },
      });
    });

    it('VALID: {a call operand truthy leaf} => carries the operandCallPosition that joins it to its call site', () => {
      const result = conditionLeafContract.parse({
        kind: 'leaf',
        id: 'stub/if:CallExpression,id:tooBig#leaf',
        operandCallPosition: { line: 6, column: 7 },
        operandType: { kind: 'unknown', text: 'any' },
        predicate: { kind: 'truthy' },
      });

      expect(result).toStrictEqual({
        kind: 'leaf',
        id: 'stub/if:CallExpression,id:tooBig#leaf',
        operandCallPosition: { line: 6, column: 7 },
        operandType: { kind: 'unknown', text: 'any' },
        predicate: { kind: 'truthy' },
      });
    });
  });

  describe('invalid leaves', () => {
    it('INVALID: {kind: "and"} => throws, since a connective is not a leaf', () => {
      expect(() => {
        return conditionLeafContract.parse({
          kind: 'and',
          id: 'stub#leaf',
          operandType: { kind: 'boolean' },
          predicate: { kind: 'truthy' },
        });
      }).toThrow(/Invalid literal value/u);
    });

    it('INVALID: {empty id} => throws validation error', () => {
      expect(() => {
        return conditionLeafContract.parse({
          kind: 'leaf',
          id: '',
          operandType: { kind: 'boolean' },
          predicate: { kind: 'truthy' },
        });
      }).toThrow(/at least 1/u);
    });
  });
});
