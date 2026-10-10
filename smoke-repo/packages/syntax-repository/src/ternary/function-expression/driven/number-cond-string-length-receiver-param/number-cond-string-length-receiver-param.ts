/**
 * Specimen: ternary-number-function-expression-cond-string-length-receiver-param
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
export const numberCondStringLengthReceiverParam = function (receiver: string): string {
    return receiver.length ? 'then' : 'else';
};
