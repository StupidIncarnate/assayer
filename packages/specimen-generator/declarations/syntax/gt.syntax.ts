import { syntax } from '../kit';

export const gtSyntax = syntax({
  description: 'a value compared with a limit using >',
  // Numbers and strings are what code compares with >. TypeScript also accepts booleans, but nobody writes
  // `true > false`, so a boolean instance would only add files that test nothing.
  code: <T extends number | string>(value: T, limit: T): boolean => value > limit,
  anchors: { limit: { number: 5, string: 'm' } },
});
