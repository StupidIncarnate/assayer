import { ArgvReadStub } from '@assayer/shared/contracts/argv-read/argv-read.stub';
import { ConditionLeafStub } from '@assayer/shared/contracts/condition-leaf/condition-leaf.stub';

import { conditionKnownValueTransformer } from './condition-known-value-transformer';

// A leaf known false, a leaf known true, and a call whose value is not known, for the connectives.
const ARGV_ENTRY = ArgvReadStub();
const KNOWN_FALSE = ConditionLeafStub({ operandArgvRead: ARGV_ENTRY, predicate: { kind: 'eq', literal: 'yes' } });
const KNOWN_TRUE = ConditionLeafStub({ operandArgvRead: ARGV_ENTRY, predicate: { kind: 'undefined-eq' } });
const UNKNOWN = ConditionLeafStub({ operandType: { kind: 'boolean' }, predicate: { kind: 'truthy' } });

describe('conditionKnownValueTransformer', () => {
  describe('a leaf', () => {
    it("VALID: {process.argv[2] === 'yes'} => false, the leaf's own value", () => {
      expect(conditionKnownValueTransformer({ condition: KNOWN_FALSE })).toBe(false);
    });

    it('EMPTY: {an opaque call} => undefined', () => {
      expect(conditionKnownValueTransformer({ condition: UNKNOWN })).toBe(undefined);
    });
  });

  describe('connectives', () => {
    it("VALID: {!(process.argv[2] === 'yes')} => true", () => {
      expect(conditionKnownValueTransformer({ condition: { kind: 'not', operand: KNOWN_FALSE } })).toBe(true);
    });

    it('EMPTY: {!isReady()} => undefined, since not keeps a value that is not known', () => {
      expect(conditionKnownValueTransformer({ condition: { kind: 'not', operand: UNKNOWN } })).toBe(undefined);
    });

    it('VALID: {true && true} => true', () => {
      expect(conditionKnownValueTransformer({ condition: { kind: 'and', left: KNOWN_TRUE, right: KNOWN_TRUE } })).toBe(true);
    });

    it('VALID: {unknown && false} => false, since the false side decides it', () => {
      expect(conditionKnownValueTransformer({ condition: { kind: 'and', left: UNKNOWN, right: KNOWN_FALSE } })).toBe(false);
    });

    it('VALID: {false && unknown} => false', () => {
      expect(conditionKnownValueTransformer({ condition: { kind: 'and', left: KNOWN_FALSE, right: UNKNOWN } })).toBe(false);
    });

    it('EMPTY: {true && unknown} => undefined', () => {
      expect(conditionKnownValueTransformer({ condition: { kind: 'and', left: KNOWN_TRUE, right: UNKNOWN } })).toBe(undefined);
    });

    it('VALID: {false || false} => false', () => {
      expect(conditionKnownValueTransformer({ condition: { kind: 'or', left: KNOWN_FALSE, right: KNOWN_FALSE } })).toBe(false);
    });

    it('VALID: {unknown || true} => true, since the true side decides it', () => {
      expect(conditionKnownValueTransformer({ condition: { kind: 'or', left: UNKNOWN, right: KNOWN_TRUE } })).toBe(true);
    });

    it('EMPTY: {false || unknown} => undefined', () => {
      expect(conditionKnownValueTransformer({ condition: { kind: 'or', left: KNOWN_FALSE, right: UNKNOWN } })).toBe(undefined);
    });
  });
});
