import { syntax } from '../kit';

export const nullishSyntax = syntax({
  description: 'a value that may be undefined, defaulted with ??',
  code: <T>(value: T | undefined, fallback: T): T => value ?? fallback,
  // A generic hole's anchor gives one value per type the hole can become.
  anchors: { fallback: { number: 0, string: '', boolean: false } },
});
