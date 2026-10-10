/**
 * Specimen: ternary-string-async-function-cond-const
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
const cond: string = 'abc';

export async function stringCondConst(): Promise<string> {
    await Promise.resolve();
    return cond ? 'then' : 'else';
}
