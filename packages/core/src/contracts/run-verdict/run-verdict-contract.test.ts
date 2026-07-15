import { runVerdictContract } from './run-verdict-contract';
import { RunVerdictStub } from './run-verdict.stub';

describe('runVerdictContract', () => {
  describe('valid verdicts', () => {
    it('VALID: {stub default} => parses a passing run', () => {
      expect(runVerdictContract.parse(RunVerdictStub())).toStrictEqual({ passed: true });
    });

    // The reason this is not AdapterResult: a failing run must be REPRESENTABLE. AdapterResult's
    // success is a literal `true` meaning "the side effect happened", which cannot say "it ran and a
    // case did not reach its predicted exit".
    it('VALID: {passed: false} => parses a failing run', () => {
      expect(runVerdictContract.parse(RunVerdictStub({ passed: false }))).toStrictEqual({ passed: false });
    });
  });

  describe('invalid verdicts', () => {
    it('INVALID: {no passed field} => throws validation error', () => {
      expect(() => {
        return runVerdictContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
