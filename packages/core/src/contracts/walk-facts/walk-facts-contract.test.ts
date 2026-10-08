import { IndexDemandStub } from '../index-demand/index-demand.stub';
import { ScopeRecordStub } from '../scope-record/scope-record.stub';
import { WalkNodeStub } from '../walk-node/walk-node.stub';
import { walkFactsContract } from './walk-facts-contract';
import { WalkFactsStub } from './walk-facts.stub';

describe('walkFactsContract', () => {
  describe('valid walk facts', () => {
    it('EMPTY: {stub default} => parses an empty fact set', () => {
      const facts = WalkFactsStub();

      const result = walkFactsContract.parse(facts);

      expect(result).toStrictEqual(facts);
    });

    it('VALID: {scopes and nodes} => parses a populated fact set', () => {
      const facts = WalkFactsStub({ scopes: [ScopeRecordStub()], nodes: [WalkNodeStub()] });

      const result = walkFactsContract.parse(facts);

      expect(result).toStrictEqual(facts);
    });

    it('VALID: {looseIndexDemands} => parses walk facts with index demands', () => {
      const facts = WalkFactsStub({ looseIndexDemands: [IndexDemandStub()] });

      const result = walkFactsContract.parse(facts);

      expect(result).toStrictEqual(facts);
    });
  });

  describe('invalid walk facts', () => {
    // Every channel is required, never optional (D22's "an analysis that can omit its own blind
    // spots reads as complete" applies to every one of them, not just the admission channels) — so
    // the rule is the SAME for all fourteen. Derived from the contract's own shape rather than a
    // hand-typed list, so a field added later is covered with no edit here.
    const REQUIRED_FIELDS = Object.keys(walkFactsContract.shape);

    it.each(REQUIRED_FIELDS)('INVALID: {missing %s} => throws validation error', (field) => {
      const entries = Object.entries(WalkFactsStub()).filter(([key]) => key !== field);

      expect(() => walkFactsContract.parse(Object.fromEntries(entries))).toThrow(/Invalid input: expected array, received undefined/u);
    });
  });
});
