import { ConditionLeafStub, TypeDescriptorStub } from '@assayer/shared/contracts';

import { substituteConditionTypesTransformer } from './substitute-condition-types-transformer';

describe('substituteConditionTypesTransformer', () => {
  describe('a single leaf whose operand type is an opaque reference', () => {
    it("VALID: {level === 'low' typed Level} => the operand becomes the declared union", () => {
      const condition = ConditionLeafStub({
        id: 'shout/if:level===low#leaf',
        operandParamName: 'level',
        operandType: { kind: 'unknown', text: 'Level', typeRef: 'Level' },
        predicate: { kind: 'eq', literal: 'low' },
      });

      expect(
        substituteConditionTypesTransformer({
          condition,
          resolved: new Map([
            [
              'Level',
              TypeDescriptorStub({
                kind: 'union',
                members: [{ kind: 'literal', value: 'low' }, { kind: 'literal', value: 'high' }],
              }),
            ],
          ]),
        }),
      ).toStrictEqual({
        kind: 'leaf',
        id: 'shout/if:level===low#leaf',
        operandParamName: 'level',
        operandType: {
          kind: 'union',
          members: [{ kind: 'literal', value: 'low' }, { kind: 'literal', value: 'high' }],
        },
        predicate: { kind: 'eq', literal: 'low' },
      });
    });

    it('VALID: {a reference the map does not carry} => the leaf is unchanged', () => {
      const condition = ConditionLeafStub({
        id: 'shout/if:level===low#leaf',
        operandParamName: 'level',
        operandType: { kind: 'unknown', text: 'Widget', typeRef: 'Widget' },
        predicate: { kind: 'eq', literal: 'low' },
      });

      expect(substituteConditionTypesTransformer({ condition, resolved: new Map([['Level', TypeDescriptorStub({ kind: 'string' })]]) })).toStrictEqual({
        kind: 'leaf',
        id: 'shout/if:level===low#leaf',
        operandParamName: 'level',
        operandType: { kind: 'unknown', text: 'Widget', typeRef: 'Widget' },
        predicate: { kind: 'eq', literal: 'low' },
      });
    });
  });

  describe('a compound condition', () => {
    it('VALID: {a && b, both opaque} => both leaves move together', () => {
      const left = ConditionLeafStub({
        id: 'decide/if#leaf.0',
        operandParamName: 'level',
        operandType: { kind: 'unknown', text: 'Level', typeRef: 'Level' },
        predicate: { kind: 'eq', literal: 'low' },
      });
      const right = ConditionLeafStub({
        id: 'decide/if#leaf.1',
        operandParamName: 'other',
        operandType: { kind: 'unknown', text: 'Level', typeRef: 'Level' },
        predicate: { kind: 'eq', literal: 'high' },
      });

      expect(
        substituteConditionTypesTransformer({
          condition: { kind: 'and', left, right },
          resolved: new Map([['Level', TypeDescriptorStub({ kind: 'string' })]]),
        }),
      ).toStrictEqual({
        kind: 'and',
        left: {
          kind: 'leaf',
          id: 'decide/if#leaf.0',
          operandParamName: 'level',
          operandType: { kind: 'string' },
          predicate: { kind: 'eq', literal: 'low' },
        },
        right: {
          kind: 'leaf',
          id: 'decide/if#leaf.1',
          operandParamName: 'other',
          operandType: { kind: 'string' },
          predicate: { kind: 'eq', literal: 'high' },
        },
      });
    });

    it('VALID: {a negated leaf} => the operand inside the negation moves', () => {
      const operand = ConditionLeafStub({
        id: 'decide/if#leaf',
        operandParamName: 'level',
        operandType: { kind: 'unknown', text: 'Level', typeRef: 'Level' },
        predicate: { kind: 'eq', literal: 'low' },
      });

      expect(
        substituteConditionTypesTransformer({
          condition: { kind: 'not', operand },
          resolved: new Map([['Level', TypeDescriptorStub({ kind: 'string' })]]),
        }),
      ).toStrictEqual({
        kind: 'not',
        operand: {
          kind: 'leaf',
          id: 'decide/if#leaf',
          operandParamName: 'level',
          operandType: { kind: 'string' },
          predicate: { kind: 'eq', literal: 'low' },
        },
      });
    });

    it('VALID: {a || b} => the or connective is preserved and both leaves move', () => {
      const left = ConditionLeafStub({
        id: 'decide/if#leaf.0',
        operandParamName: 'level',
        operandType: { kind: 'unknown', text: 'Level', typeRef: 'Level' },
        predicate: { kind: 'eq', literal: 'low' },
      });
      const right = ConditionLeafStub({
        id: 'decide/if#leaf.1',
        operandParamName: 'size',
        operandType: { kind: 'number' },
        predicate: { kind: 'gt', literal: 3 },
      });

      expect(
        substituteConditionTypesTransformer({
          condition: { kind: 'or', left, right },
          resolved: new Map([['Level', TypeDescriptorStub({ kind: 'string' })]]),
        }),
      ).toStrictEqual({
        kind: 'or',
        left: {
          kind: 'leaf',
          id: 'decide/if#leaf.0',
          operandParamName: 'level',
          operandType: { kind: 'string' },
          predicate: { kind: 'eq', literal: 'low' },
        },
        right: {
          kind: 'leaf',
          id: 'decide/if#leaf.1',
          operandParamName: 'size',
          operandType: { kind: 'number' },
          predicate: { kind: 'gt', literal: 3 },
        },
      });
    });
  });

  describe('a leaf whose operand names no reference', () => {
    it('EMPTY: {an empty map} => the condition is unchanged', () => {
      const condition = ConditionLeafStub({
        id: 'decide/if#leaf',
        operandParamName: 'size',
        operandType: { kind: 'number' },
        predicate: { kind: 'gt', literal: 3 },
      });

      expect(substituteConditionTypesTransformer({ condition, resolved: new Map() })).toStrictEqual({
        kind: 'leaf',
        id: 'decide/if#leaf',
        operandParamName: 'size',
        operandType: { kind: 'number' },
        predicate: { kind: 'gt', literal: 3 },
      });
    });
  });
});
