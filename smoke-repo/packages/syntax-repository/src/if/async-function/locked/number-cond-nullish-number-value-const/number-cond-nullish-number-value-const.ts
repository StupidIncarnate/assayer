/**
 * Specimen: if-number-async-function-cond-nullish-number-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if on line 25: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 28
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
const value: number | undefined = 3;

export async function numberCondNullishNumberValueConst(): Promise<string> {
    await Promise.resolve();
    if (value ?? 0) {
        return 'then';
    }
    return 'else';
}
