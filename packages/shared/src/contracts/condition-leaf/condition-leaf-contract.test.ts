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

    it('VALID: {a typeof operand} => carries operandIsTypeof', () => {
      const result = conditionLeafContract.parse({
        kind: 'leaf',
        id: 'stub/if:BinaryExpression,TypeOfExpression,id:target,EqualsEqualsEqualsToken,str:string#leaf',
        operandIsTypeof: true,
        operandType: { kind: 'string' },
        predicate: { kind: 'eq', literal: 'string' },
      });

      expect(result).toStrictEqual({
        kind: 'leaf',
        id: 'stub/if:BinaryExpression,TypeOfExpression,id:target,EqualsEqualsEqualsToken,str:string#leaf',
        operandIsTypeof: true,
        operandType: { kind: 'string' },
        predicate: { kind: 'eq', literal: 'string' },
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

    it('VALID: {an env operand read through steps} => carries the env var name and its steps in order', () => {
      const result = conditionLeafContract.parse({
        kind: 'leaf',
        id: 'stub/if:id:receiver#leaf',
        operandParamName: 'receiver',
        operandEnvVarName: 'RECEIVER',
        operandEnvSteps: [{ kind: 'default', value: '' }, { kind: 'split', separator: ',' }, { kind: 'map' }],
        operandType: { kind: 'array', element: { kind: 'unknown', text: 'unknown' } },
        predicate: { kind: 'length-neq', literal: 0 },
      });

      expect(result).toStrictEqual({
        kind: 'leaf',
        id: 'stub/if:id:receiver#leaf',
        operandParamName: 'receiver',
        operandEnvVarName: 'RECEIVER',
        operandEnvSteps: [{ kind: 'default', value: '' }, { kind: 'split', separator: ',' }, { kind: 'map' }],
        operandType: { kind: 'array', element: { kind: 'unknown', text: 'unknown' } },
        predicate: { kind: 'length-neq', literal: 0 },
      });
    });
  });

  describe('invalid leaves', () => {
    it('INVALID: {operandEnvSteps: []} => throws, since a raw read carries no steps field at all', () => {
      expect(() => {
        return conditionLeafContract.parse({
          kind: 'leaf',
          id: 'stub#leaf',
          operandEnvVarName: 'MODE',
          operandEnvSteps: [],
          operandType: { kind: 'string' },
          predicate: { kind: 'truthy' },
        });
      }).toThrow(/Too small: expected array to have >=1 items/u);
    });

    it('INVALID: {kind: "and"} => throws, since a connective is not a leaf', () => {
      expect(() => {
        return conditionLeafContract.parse({
          kind: 'and',
          id: 'stub#leaf',
          operandType: { kind: 'boolean' },
          predicate: { kind: 'truthy' },
        });
      }).toThrow(/Invalid input: expected/u);
    });

    it('INVALID: {empty id} => throws validation error', () => {
      expect(() => {
        return conditionLeafContract.parse({
          kind: 'leaf',
          id: '',
          operandType: { kind: 'boolean' },
          predicate: { kind: 'truthy' },
        });
      }).toThrow(/Too small: expected string to have >=1 characters/u);
    });
  });
});
