/**
 * Specimen: ternary-number-function-declaration-default-param-cond-array-length-number-receiver-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary then on line 22: driven
 * - ternary else on line 22: driven
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
export function numberDefaultParamCondArrayLengthNumberReceiverParam(receiver: readonly number[], label: string = receiver.length ? 'then' : 'else'): string {
    return label;
}
