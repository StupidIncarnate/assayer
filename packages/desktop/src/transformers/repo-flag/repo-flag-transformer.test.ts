import { repoFlagTransformer } from './repo-flag-transformer';

describe('repoFlagTransformer', () => {
  describe('extracting the repo flag', () => {
    it('VALID: {argv with --repo} => returns the repo path', () => {
      const result = repoFlagTransformer({ argv: ['--repo', '/tmp/target'] });

      expect(result).toBe('/tmp/target');
    });

    it('EMPTY: {argv without --repo} => defaults to "."', () => {
      const result = repoFlagTransformer({ argv: ['electron', 'main.js'] });

      expect(result).toBe('.');
    });
  });
});
