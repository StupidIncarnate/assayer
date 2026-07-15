import { cliUsageStatics } from './cli-usage-statics';

describe('cliUsageStatics', () => {
  describe('text', () => {
    it('VALID: text => is the full top-level usage banner', () => {
      expect(cliUsageStatics.text).toBe(
        'Usage: assayer <command>\n\nCommands:\n  status   Show assayer version and core status\n  unit     Run the derived cases for one or more files (assayer unit <path...>)\n  detail   Print one saved run in full (assayer detail <runId>)\n  docs     Print documentation (assayer docs [topic])\n  help     Show this usage information\n  version  Print the assayer version',
      );
    });
  });
});
