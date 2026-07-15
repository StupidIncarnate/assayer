import { runIdContract } from './run-id-contract';
import { RunIdStub } from './run-id.stub';

describe('runIdContract', () => {
  describe('valid run ids', () => {
    it('VALID: {stub default} => parses', () => {
      expect(runIdContract.parse(RunIdStub())).toBe('r-1784093000000');
    });

    it('VALID: {a content hash} => parses, which is what a real run id is', () => {
      expect(runIdContract.parse('b94b9541e49b3f0b8670e72fbe468d26c99af7a070a64bfcc2e5f86e14d09d54')).toBe(
        'b94b9541e49b3f0b8670e72fbe468d26c99af7a070a64bfcc2e5f86e14d09d54',
      );
    });
  });

  describe('invalid run ids', () => {
    it('INVALID: {empty string} => throws, since it would address every run and none', () => {
      expect(() => {
        return runIdContract.parse('');
      }).toThrow(/at least 1/u);
    });
  });
});
