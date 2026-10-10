/**
 * Specimen: if-number-function-declaration-body-cond-array-length-number-receiver-param
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
export function numberBodyCondArrayLengthNumberReceiverParam(receiver: readonly number[]): string {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
}
