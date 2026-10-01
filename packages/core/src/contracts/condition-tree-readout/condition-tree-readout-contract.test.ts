import { conditionTreeReadoutContract } from './condition-tree-readout-contract';
import { ConditionTreeReadoutStub } from './condition-tree-readout.stub';

describe('conditionTreeReadoutContract', () => {
  describe('valid readouts', () => {
    it('VALID: {stub default} => parses a one-leaf condition with its probe site', () => {
      const readout = ConditionTreeReadoutStub();

      expect(conditionTreeReadoutContract.parse(readout)).toStrictEqual({
        condition: {
          kind: 'leaf',
          id: 'grade/if:BinaryExpression,id:score,GreaterThanToken,num:5#leaf',
          operandParamName: 'score',
          operandType: { kind: 'number' },
          predicate: { kind: 'gt', literal: 5 },
        },
        sites: [
          {
            id: 'grade/if:BinaryExpression,id:score,GreaterThanToken,num:5#leaf',
            kind: 'cond',
            start: 64,
            end: 73,
          },
        ],
      });
    });

    it('VALID: {sites: []} => parses a condition with no probe sites', () => {
      const readout = ConditionTreeReadoutStub({ sites: [] });

      expect(conditionTreeReadoutContract.parse(readout)).toStrictEqual({
        condition: {
          kind: 'leaf',
          id: 'grade/if:BinaryExpression,id:score,GreaterThanToken,num:5#leaf',
          operandParamName: 'score',
          operandType: { kind: 'number' },
          predicate: { kind: 'gt', literal: 5 },
        },
        sites: [],
      });
    });
  });

  describe('invalid readouts', () => {
    it('INVALID: {sites missing} => throws validation error', () => {
      expect(() => {
        return conditionTreeReadoutContract.parse({
          condition: { kind: 'not', operand: { kind: 'and', left: {}, right: {} } },
        });
      }).toThrow(/Invalid input/u);
    });
  });
});
