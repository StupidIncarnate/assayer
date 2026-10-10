/**
 * Specimen: ternary-boolean-arrow-function-expression-body-cond-not-boolean-value-const
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
const value: boolean = true;

export const booleanExpressionBodyCondNotBooleanValueConst = (): string => !value ? 'then' : 'else';
