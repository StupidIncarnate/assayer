/**
 * Specimen: ternary-boolean-arrow-function-expression-body-cond-gt-string-value-param
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
export const booleanExpressionBodyCondGtStringValueParam = (value: string): string => value > 'm' ? 'then' : 'else';
