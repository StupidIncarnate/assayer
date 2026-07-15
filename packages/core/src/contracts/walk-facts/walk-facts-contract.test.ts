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
  });

  describe('invalid walk facts', () => {
    it('INVALID: {missing looseExits} => throws validation error', () => {
      expect(() => {
        return walkFactsContract.parse({ scopes: [], looseBranches: [], nodes: [] });
      }).toThrow(/Required/u);
    });
  });
});
