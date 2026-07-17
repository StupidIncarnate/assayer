/**
 * PURPOSE: The exact shape the analyzer recognizes as reading the process environment —
 *   `Number(process.env.<NAME>)`.
 *
 *   These are NAMES of runtime globals, not a naming convention: `process` and `Number` mean one
 *   thing each in a JavaScript program, and `read-env-operand` proves that meaning rather than
 *   assuming it — it asks the checker whether anything in the file declares them, and declines when
 *   something does. A file that shadows either is opting out of this rule, not evading it.
 *
 *   `coercion` is `Number` and only `Number` because it is the one whose INVERSE the derivation can
 *   write down: `Number(String(6)) === 6` for every value the range engine picks, so a case can put
 *   an operand where a predicate wants it. `cause-arrange` owns that inverse, because branding its
 *   result needs a contract and a statics file may import none. Widening this set without an inverse
 *   beside it would derive cases that cannot drive what they claim.
 *
 * USAGE:
 * envSourceStatics.global;
 * // Returns 'process'
 */
export const envSourceStatics = {
  global: 'process',
  property: 'env',
  coercion: 'Number',
} as const;
