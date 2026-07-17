import { testPathPatternTransformer } from './test-path-pattern-transformer';

describe('testPathPatternTransformer', () => {
  describe('a plain run directory', () => {
    it('VALID: {/cache/runs/r1} => the path with a trailing separator', () => {
      expect(String(testPathPatternTransformer({ runDir: '/cache/runs/r1' }))).toBe('/cache/runs/r1/');
    });
  });

  describe('a directory containing regex metacharacters', () => {
    // The real cache lives under `.assayer`, so this is the everyday path, not an exotic one. Jest
    // matches the pattern as a regex, where an unescaped `.` means "any character".
    it('VALID: {a dot in the path} => escaped, so it cannot match any other character', () => {
      expect(String(testPathPatternTransformer({ runDir: '/repo/.assayer/cache/runs/r1' }))).toBe(
        '/repo/\\.assayer/cache/runs/r1/',
      );
    });

    it('EDGE: {parentheses and plus in the path} => every metacharacter escaped', () => {
      expect(String(testPathPatternTransformer({ runDir: '/tmp/my (dir)+/runs/r1' }))).toBe(
        '/tmp/my \\(dir\\)\\+/runs/r1/',
      );
    });
  });

  describe('run ids that prefix one another', () => {
    // The trailing separator is what makes this safe: without it `r1` also matches `r10/…`, and the
    // run would execute a file it was never asked to.
    it('EDGE: {r1 vs r10} => the r1 pattern does not match the r10 path', () => {
      const pattern = String(testPathPatternTransformer({ runDir: '/cache/runs/r1' }));

      expect(new RegExp(pattern, 'u').test('/cache/runs/r10/assayer.test.js')).toBe(false);
    });

    it('VALID: {r1} => the r1 pattern matches its own test file', () => {
      const pattern = String(testPathPatternTransformer({ runDir: '/cache/runs/r1' }));

      expect(new RegExp(pattern, 'u').test('/cache/runs/r1/assayer.test.js')).toBe(true);
    });
  });
});
