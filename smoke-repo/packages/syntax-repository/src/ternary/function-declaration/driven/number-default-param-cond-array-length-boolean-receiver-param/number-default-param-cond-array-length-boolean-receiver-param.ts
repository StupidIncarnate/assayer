/**
 * Specimen: ternary-number-function-declaration-default-param-cond-array-length-boolean-receiver-param
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
export function numberDefaultParamCondArrayLengthBooleanReceiverParam(receiver: readonly boolean[], label: string = receiver.length ? 'then' : 'else'): string {
    return label;
}
