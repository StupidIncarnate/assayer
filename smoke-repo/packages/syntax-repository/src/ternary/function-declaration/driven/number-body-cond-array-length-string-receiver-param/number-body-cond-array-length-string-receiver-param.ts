/**
 * Specimen: ternary-number-function-declaration-body-cond-array-length-string-receiver-param
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
export function numberBodyCondArrayLengthStringReceiverParam(receiver: readonly string[]): string {
    return receiver.length ? 'then' : 'else';
}
