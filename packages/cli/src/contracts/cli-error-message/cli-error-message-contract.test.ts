import { cliErrorMessageContract } from './cli-error-message-contract';
import { CliErrorMessageStub } from './cli-error-message.stub';

describe('cliErrorMessageContract', () => {
  describe('valid message', () => {
    it('VALID: {value: "assayer.config.json: invalid JSON at line 3 column 12: Unexpected token }"} => parses successfully', () => {
      const message = CliErrorMessageStub({
        value: 'assayer.config.json: invalid JSON at line 3 column 12: Unexpected token }',
      });

      const result = cliErrorMessageContract.parse(message);

      expect(result).toBe('assayer.config.json: invalid JSON at line 3 column 12: Unexpected token }');
    });
  });

  describe('invalid message', () => {
    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => {
        return cliErrorMessageContract.parse('');
      }).toThrow(/Too small: expected string to have >=1 characters/u);
    });
  });
});
