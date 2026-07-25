import { AssayerFlow } from './assayer-flow';
import { docsOverviewStatics } from '../../statics/docs-overview/docs-overview-statics';
import { cliUsageStatics } from '../../statics/cli-usage/cli-usage-statics';
import { assayerCliHarness } from '../../../test/harnesses/assayer-cli.harness';

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

  describe('detail command (non-exempt — runs the precheck before dispatching)', () => {
    const cli = assayerCliHarness();

    // Proves the WIRING rather than the responder in isolation: real argv routed by AssayerFlow
    // through the real precheck's resolved configDir into DetailShowResponder, over the actual built
    // binary rather than a responder called with hand-fed params. The precheck runs first even though
    // this command's own error has nothing to do with the compile — an unrecognized run id is still a
    // precheck-then-dispatch command, never a shortcut.
    it("ERROR: {argv: [\"detail\", \"fake-run-id\"], valid config, no saved run} => the precheck runs, then the exact unknown-run error", async () => {
      cli.writeConfig({ json: '{"repoRoot":".","exclude":[]}' });
      cli.writeSource({ relPath: 'src/sample.ts', source: 'export const sample = (): number => 1;\n' });

      const { exitCode, stdout, stderr } = await cli.run({ argv: ['detail', 'fake-run-id'] });

      expect(exitCode).toBe(1);
      expect(stdout).toMatch(/^Assayer is updating caches\n[\s\S]*\n$/u);
      expect(stderr).toBe(
        "assayer detail: no saved run with id 'fake-run-id'.\n\n" +
          'Runs live in .assayer/cache/runs and are disposable — clearing the cache removes them.\n' +
          'Produce one with: assayer unit <path...>\n',
      );
    });
  });
});
