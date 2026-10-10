/**
 * Specimen: if-boolean-module-statement-cond-external
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
if (process.argv[2] === 'yes') {
    console.log('then');
}

console.log('else');

export {};
