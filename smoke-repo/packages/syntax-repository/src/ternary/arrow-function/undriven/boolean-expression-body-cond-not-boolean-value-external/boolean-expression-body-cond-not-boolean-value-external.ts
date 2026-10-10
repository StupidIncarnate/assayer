/**
 * Specimen: ternary-boolean-arrow-function-expression-body-cond-not-boolean-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 22: driven
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
export const booleanExpressionBodyCondNotBooleanValueExternal = (): string => !(process.argv[2] === 'yes') ? 'then' : 'else';
