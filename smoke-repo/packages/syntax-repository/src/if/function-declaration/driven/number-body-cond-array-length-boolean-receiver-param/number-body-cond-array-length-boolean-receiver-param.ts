/**
 * Specimen: if-number-function-declaration-body-cond-array-length-boolean-receiver-param
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
export function numberBodyCondArrayLengthBooleanReceiverParam(receiver: readonly boolean[]): string {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
}
