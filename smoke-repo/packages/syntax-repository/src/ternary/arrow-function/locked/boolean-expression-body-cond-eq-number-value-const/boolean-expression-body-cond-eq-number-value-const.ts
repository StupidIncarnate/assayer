/**
 * Specimen: ternary-boolean-arrow-function-expression-body-cond-eq-number-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary on line 23: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 23
 *
 * Expected undriven lines:
 * - none
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
const value: number = 3;

export const booleanExpressionBodyCondEqNumberValueConst = (): string => value === 7 ? 'then' : 'else';
