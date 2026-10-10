/**
 * Specimen: if-number-module-statement-cond-nullish-number-value-env
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary then on line 24: driven
 * - ternary else on line 24: driven
 * - if then on line 26: driven
 * - if else on line 26: driven
 *
 * Expected lint errors:
 * - none
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
const value = process.env.VALUE === undefined ? undefined : Number(process.env.VALUE);

if (value ?? 0) {
    console.log('then');
}

console.log('else');

export {};
