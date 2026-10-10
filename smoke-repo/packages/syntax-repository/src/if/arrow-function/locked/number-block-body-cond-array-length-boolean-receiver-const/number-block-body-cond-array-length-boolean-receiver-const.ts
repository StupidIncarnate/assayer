/**
 * Specimen: if-number-arrow-function-block-body-cond-array-length-boolean-receiver-const
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
const receiver: readonly boolean[] = [true, false, true];

export const numberBlockBodyCondArrayLengthBooleanReceiverConst = (): string => {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
};
