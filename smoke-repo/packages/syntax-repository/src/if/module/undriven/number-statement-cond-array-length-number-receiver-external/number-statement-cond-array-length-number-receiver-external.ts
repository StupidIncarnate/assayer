/**
 * Specimen: if-number-module-statement-cond-array-length-number-receiver-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if then on line 22: never
 * - if else on line 22: never
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 22
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
if (process.argv.slice(2).map(Number).length) {
    console.log('then');
}

console.log('else');

export {};
