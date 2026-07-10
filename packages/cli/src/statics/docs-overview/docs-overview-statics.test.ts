import { docsOverviewStatics } from './docs-overview-statics';

describe('docsOverviewStatics', () => {
  describe('text', () => {
    it('VALID: text => is the overview documentation paragraph', () => {
      expect(docsOverviewStatics.text).toBe(
        'Assayer is a test enforcement and generation tool for TypeScript repos. Run `assayer` to open the compiled surface explorer, `assayer status` to check the compiled cache, and `assayer docs <topic>` for topic-specific documentation (e.g. `assayer docs overview`, `assayer docs plugins`).',
      );
    });
  });
});
