/**
 * Specimen: ternary-number-function-declaration-body-cond-array-length-number-receiver-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary then on line 23: driven
 * - ternary else on line 23: driven
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - none
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export function numberBodyCondArrayLengthNumberReceiverParam(receiver: readonly number[]): string {
    return receiver.length ? 'then' : 'else';
}
