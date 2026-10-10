/**
 * Specimen: if-number-arrow-function-block-body-cond-array-length-string-receiver-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if on line 24: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 27
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
    if (receiver.length) {
        return 'then';
    }
    return 'else';
};
