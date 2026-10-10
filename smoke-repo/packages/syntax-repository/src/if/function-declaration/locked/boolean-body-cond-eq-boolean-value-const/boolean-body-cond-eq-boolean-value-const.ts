/**
 * Specimen: if-boolean-function-declaration-body-cond-eq-boolean-value-const
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
const value: boolean = true;

export function booleanBodyCondEqBooleanValueConst(): string {
    if (value === false) {
        return 'then';
    }
    return 'else';
}
