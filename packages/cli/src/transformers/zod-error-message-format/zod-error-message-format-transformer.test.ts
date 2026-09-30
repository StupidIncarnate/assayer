import { zodErrorMessageFormatTransformer } from './zod-error-message-format-transformer';

describe('zodErrorMessageFormatTransformer', () => {
  describe('single issue', () => {
    it('VALID: {issues: [{path: "repoRoot", message: "Invalid input: expected string, received number"}]} => returns "repoRoot: Invalid input: expected string, received number"', () => {
      const result = zodErrorMessageFormatTransformer({
        issues: [{ path: 'repoRoot', message: 'Invalid input: expected string, received number' }],
      });

      expect(result).toBe('repoRoot: Invalid input: expected string, received number');
    });
  });

  describe('multiple issues', () => {
    it('EDGE: {issues: [repoRoot, version]} => returns both lines joined by newline in order', () => {
      const result = zodErrorMessageFormatTransformer({
        issues: [
          { path: 'repoRoot', message: 'Invalid input: expected string, received number' },
          { path: 'version', message: 'Invalid input: expected "1"' },
        ],
      });

      expect(result).toBe('repoRoot: Invalid input: expected string, received number\nversion: Invalid input: expected "1"');
    });
  });
});
