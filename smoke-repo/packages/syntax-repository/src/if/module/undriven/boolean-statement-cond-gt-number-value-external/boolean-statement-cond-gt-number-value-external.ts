/**
 * Specimen: if-boolean-module-statement-cond-gt-number-value-external
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
if (Number(process.argv[2]) > 5) {
    console.log('then');
}

console.log('else');

export {};
