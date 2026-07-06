import { StartAssayer } from './start-assayer';

describe('StartAssayer', () => {
  describe('routing', () => {
    it('VALID: {argv: ["status"]} => returns the status output', () => {
      const result = StartAssayer({ argv: ['status'], repoPath: '/tmp/target' });

      expect(result).toBe('assayer 1.0.0\nAssayer core online');
    });

    it('VALID: {argv: ["docs", "plugins"]} => returns the plugins documentation', () => {
      const result = StartAssayer({ argv: ['docs', 'plugins'], repoPath: '/tmp/target' });

      expect(result).toBe(
        'Assayer ships a lean core; per-technology obligations arrive as separate @assayer/* discipline and probe plugins that the core auto-detects and wires.',
      );
    });
  });
});
