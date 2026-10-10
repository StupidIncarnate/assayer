/**
 * Specimen: ternary-boolean-arrow-function-expression-body-cond-eq-string-value-param
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
export const booleanExpressionBodyCondEqStringValueParam = (value: string): string => value === 'xyz' ? 'then' : 'else';
