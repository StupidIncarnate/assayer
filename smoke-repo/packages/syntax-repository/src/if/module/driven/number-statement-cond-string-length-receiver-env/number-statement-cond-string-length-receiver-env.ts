/**
 * Specimen: if-number-module-statement-cond-string-length-receiver-env
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
const receiver = process.env.RECEIVER ?? '';

if (receiver.length) {
    console.log('then');
}

console.log('else');

export {};
