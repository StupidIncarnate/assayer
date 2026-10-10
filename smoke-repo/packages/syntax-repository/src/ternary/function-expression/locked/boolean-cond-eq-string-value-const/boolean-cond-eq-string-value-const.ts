/**
 * Specimen: ternary-boolean-function-expression-cond-eq-string-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary on line 24: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 24
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
const value: string = 'abc';

export const booleanCondEqStringValueConst = function (): string {
    return value === 'xyz' ? 'then' : 'else';
};
