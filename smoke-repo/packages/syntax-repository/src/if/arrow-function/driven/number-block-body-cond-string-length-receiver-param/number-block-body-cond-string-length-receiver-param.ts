/**
 * Specimen: if-number-arrow-function-block-body-cond-string-length-receiver-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - if on line 22: both-ways
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
    if (receiver.length) {
        return 'then';
    }
    return 'else';
};
