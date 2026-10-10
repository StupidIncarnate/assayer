/**
 * Specimen: ternary-number-module-exported-const-cond-array-length-string-receiver-const
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
const receiver: readonly string[] = ['a', 'b', 'c'];

export const numberExportedConstCondArrayLengthStringReceiverConst = receiver.length ? 'then' : 'else';
