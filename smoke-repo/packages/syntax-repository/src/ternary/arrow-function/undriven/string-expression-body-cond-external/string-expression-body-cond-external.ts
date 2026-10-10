/**
 * Specimen: ternary-string-arrow-function-expression-body-cond-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 22: never
 * - ternary else on line 22: driven
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
export const stringExpressionBodyCondExternal = (): string => process.argv[2] ?? '' ? 'then' : 'else';
