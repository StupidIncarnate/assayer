/**
 * Specimen: ternary-number-module-statement-cond-string-length-receiver-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary on line 23: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 23
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

console.log(receiver.length ? 'then' : 'else');

export {};
