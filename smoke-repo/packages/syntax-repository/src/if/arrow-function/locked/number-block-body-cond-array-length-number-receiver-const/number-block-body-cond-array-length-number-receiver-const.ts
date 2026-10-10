/**
 * Specimen: if-number-arrow-function-block-body-cond-array-length-number-receiver-const
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
const receiver: readonly number[] = [10, 20, 30];

export const numberBlockBodyCondArrayLengthNumberReceiverConst = (): string => {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
};
