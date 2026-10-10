/**
 * Specimen: ternary-string-arrow-function-expression-body-cond-const
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
const cond: string = 'abc';

export const stringExpressionBodyCondConst = (): string => cond ? 'then' : 'else';
