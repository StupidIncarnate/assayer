import { assayerCoreDocsAdapter } from './assayer-core-docs-adapter';
import { assayerCoreDocsAdapterProxy } from './assayer-core-docs-adapter.proxy';

describe('assayerCoreDocsAdapter', () => {
  describe('known topics', () => {
    it('VALID: {topic: "overview"} => returns the overview documentation', () => {
      assayerCoreDocsAdapterProxy();

      const result = assayerCoreDocsAdapter({ topic: 'overview' });

      expect(result).toStrictEqual({
        topic: 'overview',
        body: 'Assayer statically identifies what should be tested, generates and runs the tests itself, and fails like a build error when something testable is uncovered or broken.',
      });
    });
  });

  describe('unknown topics', () => {
    it('ERROR: {topic: "nope"} => throws naming the available topics', () => {
      assayerCoreDocsAdapterProxy();

      expect(() => {
        return assayerCoreDocsAdapter({ topic: 'nope' });
      }).toThrow(/Unknown docs topic "nope"/u);
    });
  });
});
