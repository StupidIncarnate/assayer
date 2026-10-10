/**
 * Specimen: if-boolean-module-statement-cond-not-boolean-value-env
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
const value = process.env.VALUE === 'true';

if (!value) {
    console.log('then');
}

console.log('else');

export {};
