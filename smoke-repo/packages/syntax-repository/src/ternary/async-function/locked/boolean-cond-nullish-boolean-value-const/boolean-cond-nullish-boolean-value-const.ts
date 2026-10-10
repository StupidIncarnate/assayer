/**
 * Specimen: ternary-boolean-async-function-cond-nullish-boolean-value-const
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
const value: boolean | undefined = true;

export async function booleanCondNullishBooleanValueConst(): Promise<string> {
    await Promise.resolve();
    return value ?? false ? 'then' : 'else';
}
