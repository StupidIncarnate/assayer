import { ScopeRecordStub } from '../scope-record/scope-record.stub';
import { WalkNodeStub } from '../walk-node/walk-node.stub';
import { walkFileResultContract } from './walk-file-result-contract';
import { WalkFileResultStub } from './walk-file-result.stub';

describe('walkFileResultContract', () => {
  describe('valid walk file results', () => {
    it('EMPTY: {stub default} => parses an empty successful walk', () => {
      const result = WalkFileResultStub();

      const parsed = walkFileResultContract.parse(result);

      expect(parsed).toStrictEqual(result);
    });

    it('VALID: {scopes, nodes} => parses a populated successful walk', () => {
      const result = WalkFileResultStub({ scopes: [ScopeRecordStub()], nodes: [WalkNodeStub()] });

      const parsed = walkFileResultContract.parse(result);

      expect(parsed).toStrictEqual(result);
    });

    it('ERROR: {success: false} => parses a positioned parse error', () => {
      const result = WalkFileResultStub({
        success: false,
        error: { line: 3, column: 7, message: "'}' expected." },
      } as never);

      const parsed = walkFileResultContract.parse(result);

      expect(parsed).toStrictEqual(result);
    });
  });

  describe('invalid walk file results', () => {
    it('INVALID: {success: true, missing nodes} => throws validation error', () => {
      expect(() => {
        return walkFileResultContract.parse({ success: true, scopes: [] });
      }).toThrow(/Required/u);
    });

    it('INVALID: {success: false, column: 0} => throws validation error', () => {
      expect(() => {
        return walkFileResultContract.parse({
          success: false,
          error: { line: 3, column: 0, message: "'}' expected." },
        });
      }).toThrow(/greater than 0/u);
    });
  });
});
