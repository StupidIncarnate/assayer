import { zodErrorMessageFormatTransformer } from './zod-error-message-format-transformer';

describe('zodErrorMessageFormatTransformer', () => {
  describe('single issue', () => {
    it('VALID: {issues: [{path: "repoRoot", message: "Expected string, received number"}]} => returns "repoRoot: Expected string, received number"', () => {
      const result = zodErrorMessageFormatTransformer({
        issues: [{ path: 'repoRoot', message: 'Expected string, received number' }],
      });

      expect(result).toBe('repoRoot: Expected string, received number');
    });
  });

  describe('multiple issues', () => {
    it('EDGE: {issues: [repoRoot, version]} => returns both lines joined by newline in order', () => {
      const result = zodErrorMessageFormatTransformer({
        issues: [
          { path: 'repoRoot', message: 'Expected string, received number' },
          { path: 'version', message: 'Invalid literal value' },
        ],
      });

      expect(result).toBe('repoRoot: Expected string, received number\nversion: Invalid literal value');
    });
  });
});
