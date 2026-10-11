import { ConditionLeafStub } from '@assayer/shared/contracts/condition-leaf/condition-leaf.stub';

import { conditionOutcomesLayerTransformer } from './condition-outcomes-layer-transformer';

const LEFT = ConditionLeafStub({ id: 'f/if:ab#leaf.0' });
const RIGHT = ConditionLeafStub({ id: 'f/if:ab#leaf.1' });

describe('conditionOutcomesLayerTransformer', () => {
  describe('leaf', () => {
    it('VALID: {leaf traced true} => returns {true}', () => {
      const result = conditionOutcomesLayerTransformer({
        condition: LEFT,
        outcomesByLeafId: new Map([['f/if:ab#leaf.0', new Set([true])]]),
      });

      expect(result).toStrictEqual(new Set([true]));
    });

    it('VALID: {leaf traced both ways} => returns {true, false}', () => {
      const result = conditionOutcomesLayerTransformer({
        condition: LEFT,
        outcomesByLeafId: new Map([['f/if:ab#leaf.0', new Set([true, false])]]),
      });

      expect(result).toStrictEqual(new Set([true, false]));
    });

    it('EMPTY: {leaf never traced} => returns an empty set', () => {
      const result = conditionOutcomesLayerTransformer({ condition: LEFT, outcomesByLeafId: new Map() });

      expect(result).toStrictEqual(new Set());
    });
  });

  describe('not', () => {
    it('VALID: {not over a leaf traced false} => returns {true}', () => {
      const result = conditionOutcomesLayerTransformer({
        condition: { kind: 'not', operand: LEFT },
        outcomesByLeafId: new Map([['f/if:ab#leaf.0', new Set([false])]]),
      });

      expect(result).toStrictEqual(new Set([true]));
    });

    it('EMPTY: {not over a leaf never traced} => returns an empty set', () => {
      const result = conditionOutcomesLayerTransformer({
        condition: { kind: 'not', operand: LEFT },
        outcomesByLeafId: new Map(),
      });

      expect(result).toStrictEqual(new Set());
    });
  });

  describe('and', () => {
    it('VALID: {left true, right false} => returns {false}', () => {
      const result = conditionOutcomesLayerTransformer({
        condition: { kind: 'and', left: LEFT, right: RIGHT },
        outcomesByLeafId: new Map([
          ['f/if:ab#leaf.0', new Set([true])],
          ['f/if:ab#leaf.1', new Set([false])],
        ]),
      });

      expect(result).toStrictEqual(new Set([false]));
    });

    it('VALID: {left true, right true} => returns {true}', () => {
      const result = conditionOutcomesLayerTransformer({
        condition: { kind: 'and', left: LEFT, right: RIGHT },
        outcomesByLeafId: new Map([
          ['f/if:ab#leaf.0', new Set([true])],
          ['f/if:ab#leaf.1', new Set([true])],
        ]),
      });

      expect(result).toStrictEqual(new Set([true]));
    });

    it('VALID: {left false, right never ran} => short-circuits to {false}', () => {
      const result = conditionOutcomesLayerTransformer({
        condition: { kind: 'and', left: LEFT, right: RIGHT },
        outcomesByLeafId: new Map([['f/if:ab#leaf.0', new Set([false])]]),
      });

      expect(result).toStrictEqual(new Set([false]));
    });

    it('VALID: {left carries no probe, right traced true} => returns {true}, the right side value', () => {
      const result = conditionOutcomesLayerTransformer({
        condition: { kind: 'and', left: LEFT, right: RIGHT },
        outcomesByLeafId: new Map([['f/if:ab#leaf.1', new Set([true])]]),
      });

      expect(result).toStrictEqual(new Set([true]));
    });

    it('EMPTY: {neither side traced} => returns an empty set', () => {
      const result = conditionOutcomesLayerTransformer({
        condition: { kind: 'and', left: LEFT, right: RIGHT },
        outcomesByLeafId: new Map(),
      });

      expect(result).toStrictEqual(new Set());
    });
  });

  describe('or', () => {
    it('VALID: {left true, right never ran} => short-circuits to {true}', () => {
      const result = conditionOutcomesLayerTransformer({
        condition: { kind: 'or', left: LEFT, right: RIGHT },
        outcomesByLeafId: new Map([['f/if:ab#leaf.0', new Set([true])]]),
      });

      expect(result).toStrictEqual(new Set([true]));
    });

    it('VALID: {left false, right false} => returns {false}', () => {
      const result = conditionOutcomesLayerTransformer({
        condition: { kind: 'or', left: LEFT, right: RIGHT },
        outcomesByLeafId: new Map([
          ['f/if:ab#leaf.0', new Set([false])],
          ['f/if:ab#leaf.1', new Set([false])],
        ]),
      });

      expect(result).toStrictEqual(new Set([false]));
    });
  });

  describe('nullish coalescing shape', () => {
    it('VALID: {a ?? b read as a truthy, or a nullish and b truthy; a traced false, unprobed non-nullish leaf, b traced true} => returns {true}', () => {
      const truthyA = ConditionLeafStub({ id: 'f/if:nc#leaf.0' });
      const nonNullishA = ConditionLeafStub({ id: 'f/if:nc#leaf.1' });
      const truthyB = ConditionLeafStub({ id: 'f/if:nc#leaf.2' });

      const result = conditionOutcomesLayerTransformer({
        condition: {
          kind: 'or',
          left: truthyA,
          right: { kind: 'and', left: { kind: 'not', operand: nonNullishA }, right: truthyB },
        },
        outcomesByLeafId: new Map([
          ['f/if:nc#leaf.0', new Set([false])],
          ['f/if:nc#leaf.2', new Set([true])],
        ]),
      });

      expect(result).toStrictEqual(new Set([true]));
    });
  });
});
