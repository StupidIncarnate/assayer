import { ConditionLeafStub } from '@assayer/shared/contracts/condition-leaf/condition-leaf.stub';
import { TypeDescriptorStub } from '@assayer/shared/contracts/type-descriptor/type-descriptor.stub';

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

  describe('an object-member leaf (operandPropertyPath set)', () => {
    // The leaf's OWN `operandType` is plain `any` — the hermetic walk cannot see `config.mode`'s type
    // when `Config` is imported (§5.10) — so there is no reference on the leaf itself for
    // `substitute-type-refs` to look up. The ROOT type-reference (`operandTypeRef: 'Config'`) is what
    // resolves, and the property path is walked into ITS shape instead.
    it("VALID: {config.mode, operandTypeRef 'Config' resolves} => operandType becomes mode's real type, string", () => {
      const condition = ConditionLeafStub({
        id: 'decideA/if:config.mode===a#leaf',
        operandParamName: 'config',
        operandPropertyPath: ['mode'],
        operandTypeRef: 'Config',
        operandType: { kind: 'unknown', text: 'any' },
        predicate: { kind: 'eq', literal: 'a' },
      });

      expect(
        substituteConditionTypesTransformer({
          condition,
          resolved: new Map([
            [
              'Config',
              TypeDescriptorStub({
                kind: 'object',
                typeName: 'Config',
                properties: [{ name: 'mode', type: { kind: 'string' } }],
              }),
            ],
          ]),
        }),
      ).toStrictEqual({
        kind: 'leaf',
        id: 'decideA/if:config.mode===a#leaf',
        operandParamName: 'config',
        operandPropertyPath: ['mode'],
        operandTypeRef: 'Config',
        operandType: { kind: 'string' },
        predicate: { kind: 'eq', literal: 'a' },
      });
    });

    // The nested case: a two-segment path walks past the first property into ITS own shape.
    it('VALID: {config.db.retry, a two-segment path} => operandType becomes retry\'s real type, number', () => {
      const condition = ConditionLeafStub({
        id: 'checkDeep/if:config.db.retry===3#leaf',
        operandParamName: 'config',
        operandPropertyPath: ['db', 'retry'],
        operandTypeRef: 'Config',
        operandType: { kind: 'unknown', text: 'any' },
        predicate: { kind: 'eq', literal: 3 },
      });

      expect(
        substituteConditionTypesTransformer({
          condition,
          resolved: new Map([
            [
              'Config',
              TypeDescriptorStub({
                kind: 'object',
                typeName: 'Config',
                properties: [
                  {
                    name: 'db',
                    type: { kind: 'object', properties: [{ name: 'retry', type: { kind: 'number' } }] },
                  },
                ],
              }),
            ],
          ]),
        }),
      ).toStrictEqual({
        kind: 'leaf',
        id: 'checkDeep/if:config.db.retry===3#leaf',
        operandParamName: 'config',
        operandPropertyPath: ['db', 'retry'],
        operandTypeRef: 'Config',
        operandType: { kind: 'number' },
        predicate: { kind: 'eq', literal: 3 },
      });
    });

    it('VALID: {the root type-reference never resolves} => the leaf is unchanged, still plain any', () => {
      const condition = ConditionLeafStub({
        id: 'decideA/if:config.mode===a#leaf',
        operandParamName: 'config',
        operandPropertyPath: ['mode'],
        operandTypeRef: 'Config',
        operandType: { kind: 'unknown', text: 'any' },
        predicate: { kind: 'eq', literal: 'a' },
      });

      expect(substituteConditionTypesTransformer({ condition, resolved: new Map() })).toStrictEqual({
        kind: 'leaf',
        id: 'decideA/if:config.mode===a#leaf',
        operandParamName: 'config',
        operandPropertyPath: ['mode'],
        operandTypeRef: 'Config',
        operandType: { kind: 'unknown', text: 'any' },
        predicate: { kind: 'eq', literal: 'a' },
      });
    });

    it('VALID: {the root resolves but the property path names nothing the shape declares} => the leaf is unchanged', () => {
      const condition = ConditionLeafStub({
        id: 'decideA/if:config.other===a#leaf',
        operandParamName: 'config',
        operandPropertyPath: ['other'],
        operandTypeRef: 'Config',
        operandType: { kind: 'unknown', text: 'any' },
        predicate: { kind: 'eq', literal: 'a' },
      });

      expect(
        substituteConditionTypesTransformer({
          condition,
          resolved: new Map([
            ['Config', TypeDescriptorStub({ kind: 'object', typeName: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] })],
          ]),
        }),
      ).toStrictEqual({
        kind: 'leaf',
        id: 'decideA/if:config.other===a#leaf',
        operandParamName: 'config',
        operandPropertyPath: ['other'],
        operandTypeRef: 'Config',
        operandType: { kind: 'unknown', text: 'any' },
        predicate: { kind: 'eq', literal: 'a' },
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
