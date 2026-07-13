import { StartAssayer } from './start-assayer';

describe('StartAssayer', () => {
  describe('docs routing (exempt — passes through the flow without the precheck)', () => {
    it('VALID: {argv: ["docs", "plugins"]} => returns the plugins documentation', async () => {
      const result = await StartAssayer({ argv: ['docs', 'plugins'], repoPath: '/tmp/target' });

      expect(result).toBe(
        'Assayer ships a lean core; per-technology obligations arrive as separate @assayer/* discipline and probe plugins that the core auto-detects and wires.',
      );
    });

    it('VALID: {argv: ["docs", "overview"]} => returns the overview documentation', async () => {
      const result = await StartAssayer({ argv: ['docs', 'overview'], repoPath: '/tmp/target' });

      expect(result).toBe(
        'Assayer statically identifies what should be tested, generates and runs the tests itself, and fails like a build error when something testable is uncovered or broken.',
      );
    });
  });
});
