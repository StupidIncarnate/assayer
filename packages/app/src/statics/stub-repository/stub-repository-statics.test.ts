import { stubRepositoryStatics } from './stub-repository-statics';

describe('stubRepositoryStatics', () => {
  it('VALID: {} => exposes the stub-repository display vocabulary', () => {
    expect(stubRepositoryStatics).toStrictEqual({
      loadingMessage: 'Reading the stub repository…',
      emptyMessage: 'No stubs — run assayer',
      objectsHeading: 'Objects',
      envHeading: 'Environment',
      readersHeading: 'Read by',
      noReadersLabel: 'No readers',
      unknownLabel: 'unknown',
      guessedLabel: 'guessed',
      correctedLabel: 'corrected',
    });
  });
});
