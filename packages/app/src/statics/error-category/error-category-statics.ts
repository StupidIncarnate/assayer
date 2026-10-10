/**
 * PURPOSE: Immutable display vocabulary and concise explanation tooltips for error categories
 *   in the Tests detail panel (undriven, lints, dark spots, and gaps).
 *
 * USAGE:
 * errorCategoryStatics.title.undriven;
 * // Returns 'Undriven Errors'
 * errorCategoryStatics.explanation.undriven;
 * // Returns 'Code Assayer understood but cannot call because inputs or conditions cannot be steered.'
 */
export const errorCategoryStatics = {
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
} as const;
