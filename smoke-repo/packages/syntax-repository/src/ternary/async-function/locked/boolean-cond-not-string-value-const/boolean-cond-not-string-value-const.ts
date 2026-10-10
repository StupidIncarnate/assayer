/**
 * Specimen: ternary-boolean-async-function-cond-not-string-value-const
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
const value: string = 'abc';

export async function booleanCondNotStringValueConst(): Promise<string> {
    await Promise.resolve();
    return !value ? 'then' : 'else';
}
