/**
 * Specimen: ternary-boolean-async-function-cond-eq-boolean-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary on line 25: one-way
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

export async function booleanCondEqBooleanValueConst(): Promise<string> {
    await Promise.resolve();
    return value === false ? 'then' : 'else';
}
