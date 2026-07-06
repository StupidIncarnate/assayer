import { DocsShowResponder } from './docs-show-responder';
import { DocsShowResponderProxy } from './docs-show-responder.proxy';

describe('DocsShowResponder', () => {
  describe('known topics', () => {
    it('VALID: {topic: "overview"} => returns the overview body as CLI output', () => {
      DocsShowResponderProxy();

      const result = DocsShowResponder({ topic: 'overview' });

      expect(result).toBe(
        'Assayer statically identifies what should be tested, generates and runs the tests itself, and fails like a build error when something testable is uncovered or broken.',
      );
    });
  });

  describe('unknown topics', () => {
    it('ERROR: {topic: "nope"} => throws naming the available topics', () => {
      DocsShowResponderProxy();

      expect(() => {
        return DocsShowResponder({ topic: 'nope' });
      }).toThrow(/Unknown docs topic "nope"/u);
    });
  });
});
