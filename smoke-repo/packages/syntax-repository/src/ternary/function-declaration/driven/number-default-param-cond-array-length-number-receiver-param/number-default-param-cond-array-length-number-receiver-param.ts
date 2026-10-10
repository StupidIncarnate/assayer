/**
 * Specimen: ternary-number-function-declaration-default-param-cond-array-length-number-receiver-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary on line 21: both-ways
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
export function numberDefaultParamCondArrayLengthNumberReceiverParam(receiver: readonly number[], label: string = receiver.length ? 'then' : 'else'): string {
    return label;
}
