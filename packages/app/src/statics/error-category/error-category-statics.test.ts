import { errorCategoryStatics } from './error-category-statics';

describe('errorCategoryStatics', () => {
  it('VALID: errorCategoryStatics => defines titles, explanations, and styling for all error categories', () => {
    expect(errorCategoryStatics).toStrictEqual({
      title: {
        undriven: 'Undriven Errors',
        lints: 'Lint Errors',
        darkSpots: 'Dark Spot Errors',
        gaps: 'Gap Errors',
      },
      explanation: {
        undriven: 'Code Assayer understood but cannot call because inputs or conditions cannot be steered.',
        lints: 'Code patterns that should be fixed in the repository, such as unreachable code or dead functions.',
        darkSpots: 'Syntax that Assayer does not yet support parsing or analyzing.',
        gaps: 'Missing inputs or stubs that cannot be automatically constructed.',
      },
      colour: 'red.7',
      styleVar: 'var(--mantine-color-red-7)',
    });
  });
});
