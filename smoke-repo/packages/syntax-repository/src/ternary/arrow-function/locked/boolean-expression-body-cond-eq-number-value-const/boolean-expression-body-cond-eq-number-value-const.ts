/**
 * Specimen: ternary-boolean-arrow-function-expression-body-cond-eq-number-value-const
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
const value: number = 3;

export const booleanExpressionBodyCondEqNumberValueConst = (): string => value === 7 ? 'then' : 'else';
