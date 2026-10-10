/**
 * Specimen: ternary-string-arrow-function-expression-body-cond-nullish-string-value-param
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
export const stringExpressionBodyCondNullishStringValueParam = (value: string | undefined): string => value ?? '' ? 'then' : 'else';
