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
    // Every field on the successful arm is required, same reasoning as walkFactsContract's channels
    // — an omitted one reads as an empty walk rather than an unparsed fact. Derived from the
    // contract's own shape rather than a hand-typed list, so a field added later is covered with no
    // edit here.
    const SUCCESS_FIELDS = Object.keys(walkFileResultContract.options[0].shape).filter(
      (field) => field !== 'success',
    );

    it.each(SUCCESS_FIELDS)('INVALID: {success: true, missing %s} => throws validation error', (field) => {
      const entries = Object.entries(WalkFileResultStub()).filter(([key]) => key !== field);

      expect(() => walkFileResultContract.parse(Object.fromEntries(entries))).toThrow(/Required/u);
    });

    it('INVALID: {success: "yes"} => throws Invalid discriminator value', () => {
      expect(() => {
        return walkFileResultContract.parse({ success: 'yes' } as never);
      }).toThrow(/Invalid discriminator value/u);
    });

    it('INVALID: {success: false, no error} => throws validation error', () => {
      expect(() => {
        return walkFileResultContract.parse({ success: false });
      }).toThrow(/Required/u);
    });

    it('INVALID: {success: false, error.line: 0} => throws validation error', () => {
      expect(() => {
        return walkFileResultContract.parse({
          success: false,
          error: { line: 0, column: 7, message: "'}' expected." },
        });
      }).toThrow(/greater than 0/u);
    });

    it('INVALID: {success: false, column: 0} => throws validation error', () => {
      expect(() => {
        return walkFileResultContract.parse({
          success: false,
          error: { line: 3, column: 0, message: "'}' expected." },
        });
      }).toThrow(/greater than 0/u);
    });

    it('INVALID: {success: false, error.message: ""} => throws validation error', () => {
      expect(() => {
        return walkFileResultContract.parse({
          success: false,
          error: { line: 3, column: 7, message: '' },
        });
      }).toThrow(/too_small/u);
    });
  });
});
