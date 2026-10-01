import { cliCommandContract } from './cli-command-contract';

describe('cliCommandContract', () => {
  describe('valid commands', () => {
    it('VALID: {value: "help"} => parses successfully', () => {
      const command = 'help';

      const result = cliCommandContract.parse(command);

      expect(result).toBe('help');
    });
  });

  describe('invalid commands', () => {
    it('INVALID: {value: "nope"} => throws validation error', () => {
      expect(() => {
        return cliCommandContract.parse('nope');
      }).toThrow(/Invalid option: expected one of/u);
    });
  });
});
