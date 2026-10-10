/**
 * Specimen: if-boolean-function-declaration-body-cond-nullish-boolean-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if on line 24: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 27
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
const value: boolean | undefined = true;

export function booleanBodyCondNullishBooleanValueConst(): string {
    if (value ?? false) {
        return 'then';
    }
    return 'else';
}
