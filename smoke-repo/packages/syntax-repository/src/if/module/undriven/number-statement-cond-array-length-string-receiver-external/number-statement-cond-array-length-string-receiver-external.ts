/**
 * Specimen: if-number-module-statement-cond-array-length-string-receiver-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if on line 21: one-way
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - line 21
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
if (process.argv.slice(2).length) {
    console.log('then');
}

console.log('else');

export {};
