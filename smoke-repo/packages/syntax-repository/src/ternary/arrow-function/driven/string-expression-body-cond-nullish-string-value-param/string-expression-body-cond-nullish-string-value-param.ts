/**
 * Specimen: ternary-string-arrow-function-expression-body-cond-nullish-string-value-param
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
export const stringExpressionBodyCondNullishStringValueParam = (value: string | undefined): string => value ?? '' ? 'then' : 'else';
