/**
 * Specimen: if-number-function-declaration-body-cond-string-length-receiver-param
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
export function numberBodyCondStringLengthReceiverParam(receiver: string): string {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
}
