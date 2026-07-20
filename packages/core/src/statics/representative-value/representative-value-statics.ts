/**
 * PURPOSE: The default values the analyzer fills for a parameter no branch constrains — chosen so a
 *   generated case reads clearly: a number that is neither 0 nor 1 (both read as booleans), and a
 *   multi-character string rather than a single letter or the empty string. `string` doubles as the
 *   pattern a length-bounded string is built from, sliced to the required length.
 *
 * USAGE:
 * representativeValueStatics.number;  // 7
 * representativeValueStatics.string;  // 'abc123'
 * representativeValueStatics.boolean; // false
 */
export const representativeValueStatics = {
  number: 7,
  string: 'abc123',
  boolean: false,
} as const;
