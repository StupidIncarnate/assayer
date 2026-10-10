/**
 * Specimen: ternary-number-arrow-function-block-body-cond-array-length-string-receiver-param
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
export const numberBlockBodyCondArrayLengthStringReceiverParam = (receiver: readonly string[]): string => {
    return receiver.length ? 'then' : 'else';
};
