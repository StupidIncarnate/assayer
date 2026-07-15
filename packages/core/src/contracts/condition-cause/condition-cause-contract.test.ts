import { conditionCauseContract } from './condition-cause-contract';
import { ConditionCauseStub } from './condition-cause.stub';

describe('conditionCauseContract', () => {
  describe('valid causes', () => {
    it('VALID: {stub default} => parses one requirement wanting the leaf to hold', () => {
      const cause = ConditionCauseStub();

      const result = conditionCauseContract.parse(cause);

      expect(result).toStrictEqual({
        requirements: [
          {
            leaf: {
              kind: 'leaf',
              id: 'stub/if:BinaryExpression,id:value,GreaterThanToken,num:5#leaf',
              operandParamName: 'value',
              operandType: { kind: 'number' },
              predicate: { kind: 'gt', literal: 5 },
            },
            want: true,
          },
        ],
      });
    });

    // A cause that requires nothing is how an UNGUARDED exit is expressed — it is reached for
    // exactly one reason: nothing had to be true.
    it('EMPTY: {no requirements} => parses, since an unguarded exit has exactly one empty cause', () => {
      expect(conditionCauseContract.parse({ requirements: [] })).toStrictEqual({ requirements: [] });
    });
  });

  describe('invalid causes', () => {
    it('INVALID: {requirement missing want} => throws validation error', () => {
      expect(() => {
        return conditionCauseContract.parse({
          requirements: [
            {
              leaf: {
                kind: 'leaf',
                id: 'stub#leaf',
                operandType: { kind: 'number' },
                predicate: { kind: 'truthy' },
              },
            },
          ],
        });
      }).toThrow(/Required/u);
    });

    it('INVALID: {requirement whose leaf is a connective} => throws, since only leaves are required', () => {
      expect(() => {
        return conditionCauseContract.parse({
          requirements: [{ leaf: { kind: 'and', left: {}, right: {} }, want: true }],
        });
      }).toThrow(/Invalid literal value/u);
    });
  });
});
