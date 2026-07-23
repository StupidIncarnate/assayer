/**
 * PURPOSE: Immutable display vocabulary for the stub-repository view — what the /stubs surface says
 *   while it loads, when it has nothing to show, and how it labels a property with no read demand, a
 *   guessed env value, and a human-corrected env value. One source so the copy stays byte-identical
 *   across the widget and the tests that assert it.
 *
 * USAGE:
 * stubRepositoryStatics.loadingMessage;   // 'Reading the stub repository…'
 * stubRepositoryStatics.unknownLabel;     // 'unknown'
 */
export const stubRepositoryStatics = {
  loadingMessage: 'Reading the stub repository…',
  emptyMessage: 'No stubs — run assayer',
  objectsHeading: 'Objects',
  envHeading: 'Environment',
  readersHeading: 'Read by',
  noReadersLabel: 'No readers',
  unknownLabel: 'unknown',
  guessedLabel: 'guessed',
  correctedLabel: 'corrected',
} as const;
