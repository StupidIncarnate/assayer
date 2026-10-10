/**
 * Specimen: ternary-boolean-arrow-function-expression-body-cond-gt-string-value-param
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
export const booleanExpressionBodyCondGtStringValueParam = (value: string): string => value > 'm' ? 'then' : 'else';
