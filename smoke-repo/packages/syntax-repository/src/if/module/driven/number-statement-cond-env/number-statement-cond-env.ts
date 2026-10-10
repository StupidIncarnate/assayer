/**
 * Specimen: if-number-module-statement-cond-env
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
const cond = Number(process.env.COND);

if (cond) {
    console.log('then');
}

console.log('else');

export {};
