import { envSolutionContract } from './env-solution-contract';
import { EnvSolutionStub } from './env-solution.stub';

describe('envSolutionContract', () => {
  describe('valid solutions', () => {
    it('VALID: {stub default} => parses a string to write', () => {
      const solution = EnvSolutionStub();

      expect(envSolutionContract.parse(solution)).toStrictEqual({ kind: 'set', value: '7' });
    });

    it('EMPTY: {kind: "set", value: ""} => parses the empty string, which differs from unset', () => {
      expect(envSolutionContract.parse({ kind: 'set', value: '' })).toStrictEqual({ kind: 'set', value: '' });
    });

    it('VALID: {kind: "unset"} => parses leaving the variable unset', () => {
      expect(envSolutionContract.parse({ kind: 'unset' })).toStrictEqual({ kind: 'unset' });
    });

    it('VALID: {kind: "unreachable"} => parses a proven contradiction', () => {
      expect(envSolutionContract.parse({ kind: 'unreachable' })).toStrictEqual({ kind: 'unreachable' });
    });
  });

  describe('invalid solutions', () => {
    it('INVALID: {kind: "set", no value} => throws validation error', () => {
      expect(() => {
        return envSolutionContract.parse({ kind: 'set' });
      }).toThrow(/Invalid input/u);
    });
  });
});
