/**
 * Specimen: ternary-boolean-arrow-function-expression-body-cond-eq-number-value-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary then on line 22: driven
 * - ternary else on line 22: driven
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - none
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export const booleanExpressionBodyCondEqNumberValueParam = (value: number): string => value === 7 ? 'then' : 'else';
