/**
 * Specimen: if-boolean-function-expression-cond-eq-string-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if on line 24: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 25
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
    if (value === 'xyz') {
        return 'then';
    }
    return 'else';
};
