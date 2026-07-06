import { AssayerFlow } from './assayer-flow';

describe('AssayerFlow', () => {
  describe('status command', () => {
    it('VALID: {argv: ["status"]} => returns the core status output', () => {
      const result = AssayerFlow({ argv: ['status'], repoPath: '/tmp/target' });

      expect(result).toBe('assayer 1.0.0\nAssayer core online');
    });
  });

  describe('docs command', () => {
    it('VALID: {argv: ["docs", "overview"]} => returns the overview documentation', () => {
      const result = AssayerFlow({ argv: ['docs', 'overview'], repoPath: '/tmp/target' });

      expect(result).toBe(
        'Assayer statically identifies what should be tested, generates and runs the tests itself, and fails like a build error when something testable is uncovered or broken.',
      );
    });

    it('INVALID: {argv: ["docs"]} => returns the docs usage line', () => {
      const result = AssayerFlow({ argv: ['docs'], repoPath: '/tmp/target' });

      expect(result).toBe('Usage: assayer docs <topic>');
    });
  });
});
