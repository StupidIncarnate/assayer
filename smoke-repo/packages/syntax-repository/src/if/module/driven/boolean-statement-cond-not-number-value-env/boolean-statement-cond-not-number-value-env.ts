/**
 * Specimen: if-boolean-module-statement-cond-not-number-value-env
 *
 * Verdict: driven
 *
 * Expected branches:
 * - if then on line 24: driven
 * - if else on line 24: driven
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
const value = Number(process.env.VALUE);

if (!value) {
    console.log('then');
}

console.log('else');

export {};
