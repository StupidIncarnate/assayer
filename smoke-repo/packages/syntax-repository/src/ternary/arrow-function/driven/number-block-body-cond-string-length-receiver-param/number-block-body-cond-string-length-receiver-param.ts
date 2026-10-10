/**
 * Specimen: ternary-number-arrow-function-block-body-cond-string-length-receiver-param
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
export const numberBlockBodyCondStringLengthReceiverParam = (receiver: string): string => {
    return receiver.length ? 'then' : 'else';
};
