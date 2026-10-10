/**
 * Specimen: ternary-string-arrow-function-expression-body-cond-param
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
export const stringExpressionBodyCondParam = (cond: string): string => cond ? 'then' : 'else';
