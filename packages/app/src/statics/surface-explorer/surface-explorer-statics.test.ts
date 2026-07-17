import { surfaceExplorerStatics } from './surface-explorer-statics';

describe('surfaceExplorerStatics', () => {
  describe('surface vocabulary', () => {
    // Waiting is not actionable, so this sentence must not prescribe anything — the reader who is
    // told to run a command while the fetch is still in flight runs it against a working app.
    it('VALID: loadingMessage => states the fetch is in flight and asks for nothing', () => {
      expect(surfaceExplorerStatics.loadingMessage).toBe('Reading the compiled surface…');
    });

    // The one state 'run assayer' actually fixes: the fetch succeeded and reported nothing compiled.
    it('VALID: emptyMessage => names the empty surface and the command that fills it', () => {
      expect(surfaceExplorerStatics.emptyMessage).toBe('No compiled surface — run assayer');
    });

    // A phrase for the failed state is the thing this file must NOT grow. The resolver's Error already
    // names the fault and what satisfies it; anything added here would paraphrase or bury it. Asserting
    // the WHOLE object is what keeps a well-meaning 'Something went wrong' from being added quietly.
    it('VALID: the vocabulary => carries no sentence for a failed fetch', () => {
      expect(surfaceExplorerStatics).toStrictEqual({
        loadingMessage: 'Reading the compiled surface…',
        emptyMessage: 'No compiled surface — run assayer',
      });
    });
  });
});
