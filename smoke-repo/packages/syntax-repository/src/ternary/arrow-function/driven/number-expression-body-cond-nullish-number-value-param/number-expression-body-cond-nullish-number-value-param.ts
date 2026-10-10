/**
 * Specimen: ternary-number-arrow-function-expression-body-cond-nullish-number-value-param
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
export const numberExpressionBodyCondNullishNumberValueParam = (value: number | undefined): string => value ?? 0 ? 'then' : 'else';
