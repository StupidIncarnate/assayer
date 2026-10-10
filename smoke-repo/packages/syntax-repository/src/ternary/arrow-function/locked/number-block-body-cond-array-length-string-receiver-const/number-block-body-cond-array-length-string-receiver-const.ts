/**
 * Specimen: ternary-number-arrow-function-block-body-cond-array-length-string-receiver-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary on line 24: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 24
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

export const numberBlockBodyCondArrayLengthStringReceiverConst = (): string => {
    return receiver.length ? 'then' : 'else';
};
