/**
 * Specimen: ternary-number-arrow-function-block-body-cond-array-length-number-receiver-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary on line 22: both-ways
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
export const numberBlockBodyCondArrayLengthNumberReceiverParam = (receiver: readonly number[]): string => {
    return receiver.length ? 'then' : 'else';
};
