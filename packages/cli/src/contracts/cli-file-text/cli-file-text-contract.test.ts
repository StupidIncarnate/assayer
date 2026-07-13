import { cliFileTextContract } from './cli-file-text-contract';
import { CliFileTextStub } from './cli-file-text.stub';

describe('cliFileTextContract', () => {
  describe('valid file text', () => {
    it('VALID: {value: generated config bytes} => parses successfully', () => {
      const text = CliFileTextStub({ value: '{"version":"1","repoRoot":".","exclude":[]}' });

      const result = cliFileTextContract.parse(text);

      expect(result).toBe('{"version":"1","repoRoot":".","exclude":[]}');
    });

    it('EMPTY: {value: ""} => parses an empty file body', () => {
      const result = cliFileTextContract.parse(CliFileTextStub({ value: '' }));

      expect(result).toBe('');
    });
  });
});
