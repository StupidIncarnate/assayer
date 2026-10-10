/**
 * Specimen: if-number-function-declaration-body-cond-array-length-string-receiver-param
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
export function numberBodyCondArrayLengthStringReceiverParam(receiver: readonly string[]): string {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
}
