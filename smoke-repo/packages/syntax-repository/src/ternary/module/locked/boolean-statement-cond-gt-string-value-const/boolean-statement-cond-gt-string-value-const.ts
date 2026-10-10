/**
 * Specimen: ternary-boolean-module-statement-cond-gt-string-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary then on line 24: never
 * - ternary else on line 24: driven
 *
 * Expected lint errors:
 * - unreachable-exit on line 24
 *
 * Expected undriven errors:
 * - none
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
const value: string = 'abc';

console.log(value > 'm' ? 'then' : 'else');

export {};
