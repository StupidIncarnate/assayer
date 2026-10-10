/**
 * Specimen: ternary-number-arrow-function-expression-body-cond-array-length-boolean-receiver-param
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
export const numberExpressionBodyCondArrayLengthBooleanReceiverParam = (receiver: readonly boolean[]): string => receiver.length ? 'then' : 'else';
