import { conditionNodeContract } from './condition-node-contract';
import { ConditionNodeStub } from './condition-node.stub';

describe('conditionNodeContract', () => {
  describe('valid condition nodes', () => {
    it('VALID: {kind: "leaf"} => parses the leaf with its operand, type and predicate', () => {
      const condition = ConditionNodeStub();

      const result = conditionNodeContract.parse(condition);

      expect(result).toStrictEqual({
        kind: 'leaf',
        id: 'stub/if:BinaryExpression,id:value,GreaterThanToken,num:5#leaf:0',
        operandParamName: 'value',
        operandType: { kind: 'number' },
        predicate: { kind: 'gt', literal: 5 },
      });
    });

    it('VALID: {kind: "leaf", no operandParamName} => parses a leaf whose operand is not a simple binding', () => {
      const result = conditionNodeContract.parse({
        kind: 'leaf',
        id: 'stub/if:CallExpression,id:isReady#leaf:0',
        operandType: { kind: 'boolean' },
        predicate: { kind: 'truthy' },
      });

      expect(result).toStrictEqual({
        kind: 'leaf',
        id: 'stub/if:CallExpression,id:isReady#leaf:0',
        operandType: { kind: 'boolean' },
        predicate: { kind: 'truthy' },
      });
    });

    it('VALID: {kind: "and", two leaves} => parses both operands of the conjunction', () => {
      const result = conditionNodeContract.parse({
        kind: 'and',
        left: {
          kind: 'leaf',
          id: 'stub/if:x#leaf:0',
          operandParamName: 'score',
          operandType: { kind: 'number' },
          predicate: { kind: 'gt', literal: 5 },
        },
        right: {
          kind: 'leaf',
          id: 'stub/if:x#leaf:1',
          operandParamName: 'bonus',
          operandType: { kind: 'number' },
          predicate: { kind: 'gt', literal: 1 },
        },
      });

      expect(result).toStrictEqual({
        kind: 'and',
        left: {
          kind: 'leaf',
          id: 'stub/if:x#leaf:0',
          operandParamName: 'score',
          operandType: { kind: 'number' },
          predicate: { kind: 'gt', literal: 5 },
        },
        right: {
          kind: 'leaf',
          id: 'stub/if:x#leaf:1',
          operandParamName: 'bonus',
          operandType: { kind: 'number' },
          predicate: { kind: 'gt', literal: 1 },
        },
      });
    });

    it('VALID: {kind: "not" wrapping an "or"} => parses arbitrarily nested connectives', () => {
      const result = conditionNodeContract.parse({
        kind: 'not',
        operand: {
          kind: 'or',
          left: {
            kind: 'leaf',
            id: 'stub/if:x#leaf:0.0',
            operandParamName: 'admin',
            operandType: { kind: 'boolean' },
            predicate: { kind: 'truthy' },
          },
          right: {
            kind: 'leaf',
            id: 'stub/if:x#leaf:0.1',
            operandParamName: 'owner',
            operandType: { kind: 'boolean' },
            predicate: { kind: 'truthy' },
          },
        },
      });

      expect(result).toStrictEqual({
        kind: 'not',
        operand: {
          kind: 'or',
          left: {
            kind: 'leaf',
            id: 'stub/if:x#leaf:0.0',
            operandParamName: 'admin',
            operandType: { kind: 'boolean' },
            predicate: { kind: 'truthy' },
          },
          right: {
            kind: 'leaf',
            id: 'stub/if:x#leaf:0.1',
            operandParamName: 'owner',
            operandType: { kind: 'boolean' },
            predicate: { kind: 'truthy' },
          },
        },
      });
    });
  });

  describe('invalid condition nodes', () => {
    it('INVALID: {kind: "xor"} => throws validation error', () => {
      expect(() => {
        return conditionNodeContract.parse({ kind: 'xor' });
      }).toThrow(/Invalid discriminator/u);
    });

    it('INVALID: {kind: "leaf", no id} => throws validation error', () => {
      expect(() => {
        return conditionNodeContract.parse({
          kind: 'leaf',
          operandType: { kind: 'number' },
          predicate: { kind: 'truthy' },
        });
      }).toThrow(/Required/u);
    });
  });
});
