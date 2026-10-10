/**
 * Specimen: ternary-number-arrow-function-expression-body-cond-array-length-string-receiver-param
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
export const numberExpressionBodyCondArrayLengthStringReceiverParam = (receiver: readonly string[]): string => receiver.length ? 'then' : 'else';
