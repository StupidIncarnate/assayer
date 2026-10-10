/**
 * Specimen: ternary-boolean-async-function-cond-eq-number-value-const
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
const value: number = 3;

export async function booleanCondEqNumberValueConst(): Promise<string> {
    await Promise.resolve();
    return value === 7 ? 'then' : 'else';
}
