/**
 * Specimen: ternary-number-function-declaration-body-cond-array-length-number-receiver-param
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
export function numberBodyCondArrayLengthNumberReceiverParam(receiver: readonly number[]): string {
    return receiver.length ? 'then' : 'else';
}
