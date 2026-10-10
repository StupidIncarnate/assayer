/**
 * Specimen: ternary-boolean-arrow-function-expression-body-cond-gt-string-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 22: never
 * - ternary else on line 22: never
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 22
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export const booleanExpressionBodyCondGtStringValueExternal = (): string => (process.argv[2] ?? '') > 'm' ? 'then' : 'else';
