/**
 * Specimen: if-number-module-statement-cond-string-length-receiver-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if on line 23: one-way
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
const receiver: string = 'abc';

if (receiver.length) {
    console.log('then');
}

console.log('else');

export {};
