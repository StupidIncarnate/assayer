/**
 * Specimen: if-number-module-statement-cond-env
 *
 * Verdict: driven
 *
 * Expected branches:
 * - if on line 23: both-ways
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - none
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
const cond = Number(process.env.COND);

if (cond) {
    console.log('then');
}

console.log('else');

export {};
