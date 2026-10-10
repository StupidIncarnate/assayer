/**
 * Specimen: ternary-boolean-async-function-cond-gt-number-value-const
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

export async function booleanCondGtNumberValueConst(): Promise<string> {
    await Promise.resolve();
    return value > 5 ? 'then' : 'else';
}
