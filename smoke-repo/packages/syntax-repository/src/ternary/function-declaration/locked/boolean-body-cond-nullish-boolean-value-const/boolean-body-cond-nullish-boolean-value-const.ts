/**
 * Specimen: ternary-boolean-function-declaration-body-cond-nullish-boolean-value-const
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
const value: boolean | undefined = true;

export function booleanBodyCondNullishBooleanValueConst(): string {
    return value ?? false ? 'then' : 'else';
}
