/**
 * Specimen: if-boolean-async-function-cond-eq-number-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if on line 25: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 26
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
    if (value === 7) {
        return 'then';
    }
    return 'else';
}
