import { CliExactOutputError } from './cli-exact-output-error';

describe('CliExactOutputError', () => {
  describe('construction', () => {
    it('VALID: {message} => creates an Error instance with the exact message and name', () => {
      const error = new CliExactOutputError({
        message: 'assayer.config.json: invalid JSON at line 3 column 12: Unexpected token }',
      });

      expect(error instanceof Error).toBe(true);
      expect({ message: error.message, name: error.name }).toStrictEqual({
        message: 'assayer.config.json: invalid JSON at line 3 column 12: Unexpected token }',
        name: 'CliExactOutputError',
      });
    });
  });
});
