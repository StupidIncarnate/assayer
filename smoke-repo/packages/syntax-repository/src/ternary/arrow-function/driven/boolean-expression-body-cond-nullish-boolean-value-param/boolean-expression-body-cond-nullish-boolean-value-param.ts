/**
 * Specimen: ternary-boolean-arrow-function-expression-body-cond-nullish-boolean-value-param
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
export const booleanExpressionBodyCondNullishBooleanValueParam = (value: boolean | undefined): string => value ?? false ? 'then' : 'else';
