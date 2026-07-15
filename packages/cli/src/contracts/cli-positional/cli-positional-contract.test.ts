import { cliPositionalContract } from './cli-positional-contract';
import { CliPositionalStub } from './cli-positional.stub';

describe('cliPositionalContract', () => {
  describe('valid positionals', () => {
    it('VALID: {stub default} => parses', () => {
      const positional = CliPositionalStub();

      expect(cliPositionalContract.parse(positional)).toBe('src/format-greeting.ts');
    });

    it('VALID: {a run id} => parses, since a positional is not interpreted here', () => {
      expect(cliPositionalContract.parse('a1b2c3')).toBe('a1b2c3');
    });
  });

  describe('invalid positionals', () => {
    it('INVALID: {empty string} => throws', () => {
      expect(() => {
        return cliPositionalContract.parse('');
      }).toThrow(/at least 1/u);
    });
  });
});
