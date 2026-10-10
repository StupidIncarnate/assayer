/**
 * Specimen: ternary-string-arrow-function-expression-body-cond-nullish-string-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 25: never
 * - ternary then on line 25: never
 * - ternary else on line 25: never
 * - ternary else on line 25: never
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 25
 * - line 25
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export const stringExpressionBodyCondNullishStringValueExternal = (): string => (process.argv[2] === undefined ? undefined : process.argv[2] ?? '') ?? '' ? 'then' : 'else';
