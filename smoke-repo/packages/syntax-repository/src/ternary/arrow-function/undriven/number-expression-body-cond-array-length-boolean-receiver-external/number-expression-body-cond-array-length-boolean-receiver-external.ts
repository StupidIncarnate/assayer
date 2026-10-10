/**
 * Specimen: ternary-number-arrow-function-expression-body-cond-array-length-boolean-receiver-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary on line 21: never
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - line 21
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
export const numberExpressionBodyCondArrayLengthBooleanReceiverExternal = (): string => process.argv.slice(2).map(arg => arg === 'yes').length ? 'then' : 'else';
