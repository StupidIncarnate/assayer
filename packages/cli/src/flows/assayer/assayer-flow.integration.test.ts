import { AssayerFlow } from './assayer-flow';
import { docsOverviewStatics } from '../../statics/docs-overview/docs-overview-statics';
import { cliUsageStatics } from '../../statics/cli-usage/cli-usage-statics';

describe('AssayerFlow', () => {
  describe('help command (exempt — routed before the precheck)', () => {
    it('VALID: {argv: ["help"]} => returns the usage banner', async () => {
      const result = await AssayerFlow({ argv: ['help'], repoPath: '/tmp/target' });

      expect(result).toBe(cliUsageStatics.text);
    });

    it('VALID: {argv: ["--help"]} => returns the usage banner', async () => {
      const result = await AssayerFlow({ argv: ['--help'], repoPath: '/tmp/target' });

      expect(result).toBe(cliUsageStatics.text);
    });
  });

  describe('version command (exempt — routed before the precheck)', () => {
    it('VALID: {argv: ["version"]} => returns the assayer version line', async () => {
      const result = await AssayerFlow({ argv: ['version'], repoPath: '/tmp/target' });

      expect(result).toBe('assayer 1.0.0');
    });
  });

  describe('docs command (exempt — routed before the precheck)', () => {
    it('VALID: {argv: ["docs"]} => returns the LLM overview text', async () => {
      const result = await AssayerFlow({ argv: ['docs'], repoPath: '/tmp/target' });

      expect(result).toBe(docsOverviewStatics.text);
    });

    it('VALID: {argv: ["docs", "overview"]} => returns the overview catalog body', async () => {
      const result = await AssayerFlow({ argv: ['docs', 'overview'], repoPath: '/tmp/target' });

      expect(result).toBe(
        'Assayer statically identifies what should be tested, generates and runs the tests itself, and fails like a build error when something testable is uncovered or broken.',
      );
    });
  });

});
