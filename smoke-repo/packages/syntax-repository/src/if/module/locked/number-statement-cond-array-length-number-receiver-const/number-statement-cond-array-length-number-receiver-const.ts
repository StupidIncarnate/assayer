/**
 * Specimen: if-number-module-statement-cond-array-length-number-receiver-const
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
const receiver: readonly number[] = [10, 20, 30];

if (receiver.length) {
    console.log('then');
}

console.log('else');

export {};
