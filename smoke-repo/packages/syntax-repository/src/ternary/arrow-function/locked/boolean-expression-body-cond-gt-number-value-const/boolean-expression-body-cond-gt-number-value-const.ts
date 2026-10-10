/**
 * Specimen: ternary-boolean-arrow-function-expression-body-cond-gt-number-value-const
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

export const booleanExpressionBodyCondGtNumberValueConst = (): string => value > 5 ? 'then' : 'else';
