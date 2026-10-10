/**
 * Specimen: ternary-boolean-arrow-function-expression-body-cond-not-string-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary then on line 24: never
 * - ternary else on line 24: driven
 *
 * Expected lint errors:
 * - unreachable-exit on line 24
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
const value: string = 'abc';

export const booleanExpressionBodyCondNotStringValueConst = (): string => !value ? 'then' : 'else';
